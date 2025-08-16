const Write = async (context, webcontainerInstance) => {


  if (!webcontainerInstance) throw new Error("WebContainer not ready")
  await webcontainerInstance.fs.writeFile(context.path, context.content)
  return { ok: true, path: context.path }
}

export  { Write }
