import { Editor } from '@monaco-editor/react';
import { useState } from 'react';

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  language?: 'json' | 'javascript' | 'typescript';
}

export function SchemaEditor({
  value,
  onChange,
  height = '400px',
  language = 'json',
}: SchemaEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    onChange(newValue);

    // Validate JSON if language is json
    if (language === 'json') {
      try {
        if (newValue.trim()) {
          JSON.parse(newValue);
        }
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleFormat = () => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        onChange(formatted);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleValidate = () => {
    if (language === 'json') {
      try {
        JSON.parse(value);
        setError(null);
        alert('Valid JSON!');
      } catch (err: any) {
        setError(err.message);
        alert(`Invalid JSON: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleFormat}
          className="btn-secondary text-sm py-1 px-3"
          type="button"
        >
          Format
        </button>
        <button
          onClick={handleValidate}
          className="btn-secondary text-sm py-1 px-3"
          type="button"
        >
          Validate
        </button>
        {error && (
          <span className="text-red-400 text-sm flex items-center">
            {error}
          </span>
        )}
      </div>
      <div className="border border-dark-600 rounded-md overflow-hidden">
        <Editor
          height={height}
          language={language}
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [],
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>
    </div>
  );
}
