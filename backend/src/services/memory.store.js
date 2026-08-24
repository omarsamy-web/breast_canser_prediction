import crypto from "crypto";

const state = {
  users: [],
  datasets: [],
  predictions: [],
  metrics: []
};

export function newId() {
  return crypto.randomUUID();
}

export const memory = {
  users: {
    findByEmail(email) {
      return state.users.find((user) => user.email === email.toLowerCase());
    },
    findById(id) {
      return state.users.find((user) => user._id === id);
    },
    create(payload) {
      const user = { ...payload, _id: newId(), created_at: new Date().toISOString() };
      state.users.push(user);
      return user;
    },
    list() {
      return state.users.map(({ password, ...user }) => user);
    },
    count() {
      return state.users.length;
    }
  },
  datasets: {
    create(payload) {
      const dataset = { ...payload, _id: newId(), created_at: new Date().toISOString() };
      state.datasets.unshift(dataset);
      return dataset;
    },
    list() {
      return state.datasets;
    },
    delete(id) {
      state.datasets = state.datasets.filter((dataset) => dataset._id !== id);
    },
    count() {
      return state.datasets.length;
    }
  },
  predictions: {
    create(payload) {
      const prediction = { ...payload, _id: newId(), created_at: new Date().toISOString() };
      state.predictions.unshift(prediction);
      return prediction;
    },
    listByUser(userId) {
      return state.predictions.filter((prediction) => prediction.user_id === userId).slice(0, 100);
    },
    count() {
      return state.predictions.length;
    }
  },
  metrics: {
    create(payload) {
      const metric = { ...payload, _id: newId(), created_at: new Date().toISOString() };
      state.metrics.unshift(metric);
      return metric;
    },
    clearBest() {
      state.metrics = state.metrics.map((metric) => ({ ...metric, isBest: false }));
    },
    list() {
      return state.metrics.slice(0, 100);
    },
    count() {
      return state.metrics.length;
    }
  }
};
