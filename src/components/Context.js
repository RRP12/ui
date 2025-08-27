import { createContext, useContext, useState } from 'react';
// import { files as initialFiles } from "../../../utils/"
const filesContext = createContext("system");
import { WebContainer } from "@webcontainer/api";
export const useGetFiles = () => useContext(filesContext);

export default function ContextProvider({ children }) {
  const [files, setFiles] = useState();
  const [webcontainerInstance, setWebcontainerInstance] = useState();

  const context = {
    files,
    setFiles,
    webcontainerInstance,
    setWebcontainerInstance
  }
  return (

    <filesContext.Provider value={context}>
      {children}
    </filesContext.Provider>
  )
}

// function ContextProvider() {
//   const theme = useGetFiles();

//   return (
//     <div>
//       <p>Current theme: {theme}</p>
//     </div>
//   )
// }

