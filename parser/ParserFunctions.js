import { TokenOperations, TokenFunction } from "./Engine.js";

export const Or = (...tokenFunctions) => { 
    return TokenFunction.from((state)=>{
        let allRejected = true  
        for(const tfFunc of tokenFunctions) { 
            const op = tfFunc.call(state)
            if(op != TokenOperations.REJECT) {
                allRejected = false 
            }
            if(op == TokenOperations.ACCEPT) return TokenOperations.ACCEPT;
            if(op == TokenOperations.LOAD) return TokenOperations.LOAD;
        }
        if(allRejected == true) { 
            return TokenOperations.REJECT
        }
        return TokenOperations.SAVE
    })
}

export const Space = (optional=false) => { 
    return TokenFunction.from((state) => { 
        // console.log(`SPACE PROCESSING "${state.join("")}"`)
        const last = state[state.length-1]

        if(state.length < 2 && last !== " ") { 
            return TokenOperations.REJECT
        }
        
        if(last !== " ") { 
            return TokenOperations.LOAD
        } else { 
            return TokenOperations.SAVE 
        }
    }).optional(optional)
}

export const MultiStringMatch = (...strs) => { 
    const stringMatchFunctions = []
    for(const str of strs) { 
        stringMatchFunctions.push( 
            StringMatch(str)
        )
    }
    return Or(...stringMatchFunctions)
}

export const TypeMatch = (type) => { 
    return TokenFunction.from((state) => {
        const last = state[state.length-1]
        if(typeof(last) != "object") return TokenOperations.REJECT
        if(last.type != type) return TokenOperations.REJECT
        return TokenOperations.ACCEPT
    }) 
}

export const StringMatch = (str) => { 
  return TokenFunction.from((state) => { 
      if(state.join("") == str) { 
          return TokenOperations.ACCEPT; 
      }  
          
      if(state.length > str.length) { 
          return TokenOperations.REJECT
      }
  
      return TokenOperations.NEXT; 
      
  }).setFunctionName(`StringMatch(${str})`).join() 
}

export const Alphabetical = () => { 
  return TokenFunction.from((state)=>{
      const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
      const last = state[state.length-1] 
      const rejectOperation = state.length > 1 ? TokenOperations.LOAD : TokenOperations.REJECT

      if(typeof(last) == 'object' || Array.isArray(last)) { 
          return rejectOperation; 
      }
      if(!allowed.includes(last)) { 
          return rejectOperation; 
      }
      
      return TokenOperations.SAVE;
  }).setFunctionName("Alphabetical")
}

export const Numerical = () => { 
  return TokenFunction.from((state)=>{
      const allowed = "1234567890".split("")
      const last = state[state.length-1] 
      const rejectOperation = state.length > 1 ? TokenOperations.LOAD : TokenOperations.REJECT

      if(typeof(last) == 'object' || Array.isArray(last)) { 
          return rejectOperation; 
      }
      if(!allowed.includes(last)) { 
          return rejectOperation; 
      }
      
      return TokenOperations.SAVE;
  }).setFunctionName("Alphabetical")
}
