import axios from "axios";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const restKey = serviceRoleKey;

const client = url && restKey
  ? axios.create({
      baseURL: `${url.replace(/\/$/, "")}/rest/v1`,
      headers: {
        apikey: restKey,
        Authorization: `Bearer ${restKey}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    })
  : null;

const authAdminClient = url && serviceRoleKey
  ? axios.create({
      baseURL: `${url.replace(/\/$/, "")}/auth/v1`,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    })
  : null;

const authPublicClient = url && (anonKey || serviceRoleKey)
  ? axios.create({
      baseURL: `${url.replace(/\/$/, "")}/auth/v1`,
      headers: {
        apikey: anonKey || serviceRoleKey,
        "Content-Type": "application/json"
      },
      timeout: 30000
    })
  : null;

export function hasSupabase() {
  const isConfigured =
    url &&
    !url.includes("your-supabase-") &&
    serviceRoleKey &&
    serviceRoleKey !== "your-supabase-service-role-key" &&
    !serviceRoleKey.includes("placeholder");
  return Boolean(isConfigured && client && authAdminClient);
}

function encodeValue(value) {
  return encodeURIComponent(String(value));
}

function normalizeUser(row) {
  if (!row) return null;
  const legacyRole = row.role === "Doctor" || row.role === "Researcher";
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: legacyRole ? "Admin" : row.role,
    plan: row.plan || "free",
    credits: row.credits ?? 0,
    freePredictionUsed: row.free_prediction_used ?? false,
    created_at: row.created_at
  };
}

function normalizeAuthUser(authUser, profile = null) {
  if (!authUser) return null;
  return normalizeUser({
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    email: profile?.email || authUser.email,
    role: profile?.role || authUser.user_metadata?.role || "Patient",
    plan: profile?.plan || "free",
    credits: profile?.credits ?? 0,
    freePredictionUsed: profile?.freePredictionUsed ?? false,
    created_at: profile?.created_at || authUser.created_at
  });
}

function parseCount(contentRange) {
  if (!contentRange || !contentRange.includes("/")) return 0;
  const total = contentRange.split("/").pop();
  return total === "*" ? 0 : Number(total || 0);
}

async function list(table, params = {}) {
  const { data } = await client.get(`/${table}`, { params });
  return data || [];
}

async function maybeSingle(table, params = {}) {
  const rows = await list(table, { ...params, limit: 1 });
  return rows[0] || null;
}

async function insert(table, payload) {
  const { data } = await client.post(`/${table}`, payload, {
    headers: { Prefer: "return=representation" }
  });
  return Array.isArray(data) ? data[0] : data;
}

async function count(table) {
  const response = await client.get(`/${table}`, {
    params: { select: "id", limit: 1 },
    headers: { Prefer: "count=exact" }
  });
  return parseCount(response.headers["content-range"]);
}

export const supabaseStore = {
  users: {
    async findByEmail(email) {
      const row = await maybeSingle("app_users", { select: "*", email: `eq.${encodeValue(email.toLowerCase())}` });
      return normalizeUser(row);
    },
    async findById(id) {
      const row = await maybeSingle("app_users", { select: "*,credits,free_prediction_used", id: `eq.${encodeValue(id)}` });
      return normalizeUser(row);
    },
    async create(payload) {
      const authUser = await auth.createUser({
        email: payload.email.toLowerCase(),
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          name: payload.name,
          role: payload.role
        }
      });
      try {
        const row = await insert("app_users", {
          id: authUser.id,
          name: payload.name,
          email: payload.email.toLowerCase(),
          role: payload.role
        });
        return normalizeUser(row);
      } catch (error) {
        await auth.deleteUser(authUser.id).catch(() => {});
        throw error;
      }
    },
    async verifyPassword(email, password) {
      const authUser = await auth.signInWithPassword(email.toLowerCase(), password);
      const profile = await this.findById(authUser.id);
      return normalizeAuthUser(authUser, profile);
    },
    async list() {
      const rows = await list("app_users", { select: "id,name,email,role,plan,created_at", order: "created_at.desc" });
      return rows.map(normalizeUser);
    },
    async count() {
      return count("app_users");
    },
    async update(id, payload) {
      await client.patch("/app_users", payload, { params: { id: `eq.${encodeValue(id)}` } });
      return this.findById(id);
    }
  },
  datasets: {
    async create(payload) {
      const row = await insert("datasets", {
        filename: payload.filename,
        original_name: payload.originalName,
        path: payload.path,
        uploaded_by: payload.uploaded_by,
        stats: payload.stats
      });
      return { ...row, _id: row.id, originalName: row.original_name };
    },
    async list() {
      const rows = await list("datasets", { select: "*", order: "created_at.desc" });
      return rows.map((row) => ({ ...row, _id: row.id, originalName: row.original_name }));
    },
    async delete(id) {
      await client.delete("/datasets", { params: { id: `eq.${encodeValue(id)}` } });
    },
    async count() {
      return count("datasets");
    }
  },
  predictions: {
    async create(payload) {
      const row = await insert("predictions", {
        user_id: payload.user_id,
        model: payload.model,
        result: payload.result,
        confidence: payload.confidence,
        risk_percentage: payload.riskPercentage,
        features: payload.features,
        recommendation: payload.recommendation
      });
      return { ...row, _id: row.id, riskPercentage: row.risk_percentage };
    },
    async listByUser(userId) {
      const rows = await list("predictions", {
        select: "*",
        user_id: `eq.${encodeValue(userId)}`,
        order: "created_at.desc",
        limit: 100
      });
      return rows.map((row) => ({ ...row, _id: row.id, riskPercentage: row.risk_percentage }));
    },
    async count() {
      return count("predictions");
    }
  },
  metrics: {
    async create(payload) {
      const row = await insert("model_metrics", {
        model_name: payload.model_name,
        accuracy: payload.accuracy,
        precision: payload.precision,
        recall: payload.recall,
        f1_score: payload.f1_score,
        roc_auc: payload.roc_auc,
        confusion_matrix: payload.confusion_matrix,
        classification_report: payload.classification_report,
        feature_importance: payload.feature_importance,
        is_best: payload.isBest
      });
      return { ...row, _id: row.id, isBest: row.is_best };
    },
    async clearBest() {
      await client.patch("/model_metrics", { is_best: false }, { params: { is_best: "eq.true" } });
    },
    async list() {
      const rows = await list("model_metrics", { select: "*", order: "created_at.desc", limit: 100 });
      return rows.map((row) => ({ ...row, _id: row.id, isBest: row.is_best }));
    },
    async count() {
      return count("model_metrics");
    }
  }
};

const auth = {
  async createUser(payload) {
    const { data } = await authAdminClient.post("/admin/users", payload);
    return data;
  },
  async signInWithPassword(email, password) {
    const { data } = await authPublicClient.post("/token?grant_type=password", { email, password });
    return data.user;
  },
  async deleteUser(id) {
    await authAdminClient.delete(`/admin/users/${encodeValue(id)}`);
  }
};
