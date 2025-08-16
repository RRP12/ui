// In code.js
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor'; // Import monaco-editor

const CodeMarkDown = ({ value, language, onChange, readOnly = false, filePath }) => {
  console.log("CodeMarkDown received language:", language);
  console.log("CodeMarkDown received filePath:", filePath);

  const editorUri = filePath ? monaco.Uri.parse(`file:///${filePath}`) : undefined;

  return (
    <Editor
      height="100%"
      defaultLanguage={language || 'plaintext'} // Use language prop directly, default to plaintext
      language={language || 'plaintext'} // Use language prop directly, default to plaintext
      value={value}
      onChange={onChange}
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
      uri={editorUri} // Pass the dynamic URI
    />
  );
};

export default CodeMarkDown;