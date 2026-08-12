import { Cell, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaBrain, FaDatabase, FaHeartbeat, FaPercent, FaUserMd, FaVial } from "react-icons/fa";
import StatCard from "../components/ui/StatCard.jsx";
import ChartCard from "../components/charts/ChartCard.jsx";

const modelData = [
  { name: "KNN", accuracy: 0.94, f1: 0.93 },
  { name: "SVM", accuracy: 0.96, f1: 0.95 },
  { name: "Decision Tree", accuracy: 0.92, f1: 0.91 },
  { name: "Random Forest", accuracy: 0.98, f1: 0.97 }
];
const diagnosis = [{ name: "Benign", value: 63 }, { name: "Malignant", value: 37 }];
const history = modelData.map((item, index) => ({ run: `Run ${index + 1}`, accuracy: item.accuracy * 100 }));
const radar = [{ metric: "Accuracy", value: 98 }, { metric: "Precision", value: 97 }, { metric: "Recall", value: 96 }, { metric: "F1", value: 97 }, { metric: "ROC", value: 99 }];

export default function Dashboard() {
  return (
    <div className="page-grid">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={FaHeartbeat} label="Total Predictions" value="500000" />
        <StatCard icon={FaPercent} label="Accuracy Score" value="	99.9%" tone="green" />
        <StatCard icon={FaBrain} label="Best Model" value="Decision Tree" tone="pink" />
        <StatCard icon={FaDatabase} label="Uploaded Datasets" value="1" />
        <StatCard icon={FaVial} label="Malignant Cases" value="175,000" tone="amber" />
        <StatCard icon={FaUserMd} label="Benign Cases" value="325,000" tone="green" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Diagnosis Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={diagnosis} dataKey="value" nameKey="name" outerRadius={100}>
                <Cell fill="#10b981" /><Cell fill="#f43f5e" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Model Comparison">
          <ResponsiveContainer>
            <BarChart data={modelData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="accuracy" fill="#2563eb" /><Bar dataKey="f1" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Training History">
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="run" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Metrics Radar">
          <ResponsiveContainer>
            <RadarChart data={radar}>
              <PolarGrid /><PolarAngleAxis dataKey="metric" /><PolarRadiusAxis />
              <Radar dataKey="value" fill="#ec4899" fillOpacity={0.35} stroke="#ec4899" />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
