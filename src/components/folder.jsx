import { useState } from "react";
import { GoFileDirectoryFill, GoFileSymlinkFile } from "react-icons/go";

const Folder = ({ 
  explorer, 
  onFileSelect, 
  selectedFile,
  currentPath = "" 
}) => {
  const [expand, setExpand] = useState(false);
  
  const handleFolderClick = (e) => {
    e.stopPropagation();
    setExpand(!expand);
  };

  const handleFileClick = (e) => {
    e.stopPropagation();
    const path = currentPath || explorer.path || explorer.name;
    // console.log('File clicked:', path, 'Explorer:', explorer);
    if (onFileSelect) {
      onFileSelect(path);
    }
  };
  if (explorer.isFolder || explorer.items) {
    return (
      <div>
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 0",
            cursor: "pointer",
            backgroundColor: expand ? "#2a2d2e" : "transparent",
            userSelect: "none"
          }}
          onClick={handleFolderClick}
        >
          <GoFileDirectoryFill style={{ marginRight: 5 }} />
          <span>{explorer.name}</span>
        </div>
        <div
          style={{
            display: expand ? "block" : "none",
            paddingLeft: 15,
          }}
        >
          {explorer.items?.map((item, index) => {
            const path = currentPath 
              ? `${currentPath}/${item.name}` 
              : item.name;
            return (
              <Folder
                key={index}
                explorer={item}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                currentPath={path}
              />
            );
          })}
        </div>
      </div>
    );
  } else {
    const isSelected = selectedFile === (currentPath || explorer.path || explorer.name);
    
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 0",
          paddingLeft: 10,
          cursor: "pointer",
          backgroundColor: isSelected ? "#37373d" : "transparent",
          color: isSelected ? "#fff" : "#ccc",
          userSelect: "none"
        }}
        onClick={handleFileClick}
      >
        <GoFileSymlinkFile style={{ marginRight: 5 }} />
        <span>{explorer.name}</span>
      </div>
    );
  }
};

export default Folder;