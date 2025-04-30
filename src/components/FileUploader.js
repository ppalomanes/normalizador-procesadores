// components/FileUploader.js
import React from "react";
import {
  Upload,
  AlertCircle,
  Loader2,
  FileCode,
  HelpCircle,
} from "lucide-react";

const FileUploader = ({
  onFileUpload,
  isProcessing,
  file,
  error,
  onLoadDemo,
}) => {
  const handleChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      onFileUpload(uploadedFile);
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md dark:bg-dark-bg-secondary">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Upload className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
        Subir archivo Excel
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer flex-grow dark:border-dark-border dark:hover:border-blue-700">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                <p className="text-gray-700 dark:text-dark-text-secondary">
                  Procesando archivo...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-4 bg-blue-100 p-3 rounded-full text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  <Upload size={24} />
                </div>
                <p className="font-medium text-gray-700 mb-1 dark:text-dark-text-primary">
                  {file ? file.name : "Haga clic para seleccionar un archivo"}
                </p>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  Formatos soportados: .xlsx, .xls
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Demo button */}
        <div
          className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors cursor-pointer dark:border-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/30"
          onClick={onLoadDemo}
          style={{ width: "220px" }}
        >
          <div className="flex flex-col items-center h-full justify-center">
            <div className="mb-3 bg-blue-200 p-3 rounded-full text-blue-600 dark:bg-blue-800 dark:text-blue-300">
              <FileCode size={22} />
            </div>
            <p className="font-medium text-blue-700 mb-1 dark:text-blue-300">
              Probar con datos demo
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Carga datos de ejemplo para ver el funcionamiento
            </p>
          </div>
        </div>
      </div>

      {/* Format hints */}
      <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-start dark:bg-blue-900/30 dark:text-blue-300">
        <HelpCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-sm">
          <p className="font-medium">Formato esperado:</p>
          <p className="mt-1">
            El archivo debe contener una columna con información de
            procesadores. Se buscarán columnas con nombres como "Procesador",
            "CPU", "Microprocesador", etc.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start dark:bg-red-900/50 dark:text-red-300">
          <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
