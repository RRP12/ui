// npm install @langchain/langgraph @langchain/core

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),
});


// export StateAnnotation
console.log("StateAnnotation", StateAnnotation);