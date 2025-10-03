import { useState, useMemo } from "react";

// --- SVG Icons for a modern look ---

const FileIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const UploadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// --- Main App Component ---

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null);

  const fileName = useMemo(() => file ? file.name : 'No file chosen', [file]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setJsonData(null); // Clear previous results on new file select
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an Excel file first!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setJsonData(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setJsonData(data);
    } catch (error) {
      alert("Error uploading file. Please check the API is running at the specified URL. Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categorized_expenses.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 p-6">

      {/* Modern Gradient Background with subtle blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"></div>

      {/* Floating shapes (Subtle, less aggressive colors) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>


      <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-4xl border border-white/50 transform transition-transform duration-500 hover:shadow-3xl">

        {/* Header (Gradient Text) */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-10 tracking-tight">
          📊 Smart Expense Categorizer
        </h1>

        {/* Upload Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner">

          {/* File Input (Custom Styled Dropzone) */}
          <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-indigo-400/70 p-6 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition duration-300 w-full md:w-auto">
            <FileIcon className="w-8 h-8 text-indigo-500 mb-2"/>
            <span className="text-sm font-medium text-gray-700">Choose Excel File (.xlsx, .xls)</span>
            <span className={`mt-1 text-xs font-semibold truncate ${file ? 'text-purple-600' : 'text-gray-500'}`}>{fileName}</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden" // Hides the default input button
            />
          </label>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl shadow-lg hover:scale-[1.03] hover:shadow-xl transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto min-w-[200px] transform active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5"/>
                Upload & Process
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {jsonData && (
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-green-500">✔</span> Processed Data Output
            </h2>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700/50">
                <pre className="text-white overflow-x-auto text-sm max-h-96 w-full custom-scrollbar">
                {JSON.stringify(jsonData, null, 2)}
                </pre>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition duration-300 transform active:scale-[0.98]"
              >
                <DownloadIcon className="w-5 h-5"/>
                Download JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Keyframes and Scrollbar (Required for this component) */}
      <style>
        {`
          @keyframes blob {
            0%, 100% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(40px, -60px) scale(1.05);
            }
            66% {
              transform: translate(-30px, 30px) scale(0.95);
            }
          }
          .animate-blob {
            animation: blob 10s infinite alternate;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .shadow-3xl {
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          }
          /* Custom scrollbar for the dark JSON pre block */
          .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
              height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(147, 51, 234, 0.5); /* Purple-500 */
              border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background-color: rgba(255, 255, 255, 0.1);
          }
        `}
      </style>
    </div>
  );
}