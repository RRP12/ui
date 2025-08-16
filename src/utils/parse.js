export function parseBoltXml(xml) {
    const actions = [];
  
    // Match each <boltAction ...> ... </boltAction> block
    const boltActionRegex = /<boltAction\s+([^>]+)>([\s\S]*?)<\/boltAction>/g;
    let match;
  
    while ((match = boltActionRegex.exec(xml)) !== null) {
      const attrStr = match[1];
      const innerContent = match[2].trim();
  
      // Extract type
      const typeMatch = /type="([^"]+)"/.exec(attrStr);
      const type = typeMatch ? typeMatch[1] : null;
  
      // Extract filePath if present
      const filePathMatch = /filePath="([^"]+)"/.exec(attrStr);
      const filePath = filePathMatch ? filePathMatch[1] : null;
  
      actions.push({
        type,
        filePath,
        content: innerContent
      });
    }
  
    return actions;
  }
  

  
  
  
  
 export  function executeActions(actions, baseDir) {
    for (const action of actions) {
      try {
        if (action.type === 'file') {
          const targetPath = path.resolve(baseDir, action.filePath);
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, action.content, 'utf8');
          console.log(`✅ Created file: ${targetPath}`);
          action.status = 'done';
        } else if (action.type === 'shell') {
          console.log(`💻 Running shell in ${baseDir}: ${action.content}`);
          execSync(action.content, { stdio: 'inherit', cwd: baseDir });
          action.status = 'done';
        } else {
          console.warn(`⚠️ Unknown action type: ${action.type}`);
          action.status = 'skipped';
        }
      } catch (err) {
        console.error(`❌ Error in action (${action.type}):`, err.message);
        action.status = 'error';
      }
    }
  }
  
  // Load XML and run
//   const xmlPath = path.resolve('bolt.xml'); // Change if your XML is elsewhere
  
  
//   const baseDir = path.dirname(xmlPath); // put files in same dir as bolt.xml
//   executeActions(steps, baseDir);
  
//   console.log('Execution result:', steps);
  
  