import { TokenOperations, TokenFunction, EngineEvents, Group } from "./Engine.js";

export function CaptureUntil (...disallowedStringsArray) { 
    return TokenFunction.from(
      ({state}) => { 
        const lastState = state[state.length-1];
        if(disallowedStringsArray.includes(lastState)) { 
          return TokenOperations.LOAD;
        } else { 
          return TokenOperations.SAVE;
        }
      }
    )
}

// export const Group = (...tokenFunctions) => { 
//     if(tokenFunctions.length <= 0) return TokenFunction.empty()

//     const success = [TokenOperations.ACCEPT, TokenOperations.LOAD]
//     const failure = [TokenOperations.REJECT]
//     for(const [index, tf] of tokenFunctions.entries()) { 
//         const nextTf = tokenFunctions[index+1]
//         if(nextTf == undefined) break; 

        
//         tf.on(EngineEvents.PARSER_BEGIN, ({newTokenFunctionRequirement}) => { 
//             newTokenFunctionRequirement(nextTf)
//         })

//         const oldFunc = tf._func
//         tf._func = () => { 
//             const result = oldFunc() 
//             w3
//         }
        
//     }

//     const OneOfTf = TokenFunction.empty()
//     OneOfTf.on(EngineEvents.PARSER_BEGIN, ({newTokenFunctionRequirement}) => {
//         if(tokenFunctions.length > 0) { 
//             //debugger
//             newTokenFunctionRequirement(tokenFunctions[0])
//         }
//     })

//     return OneOfTf.setFunctionName("GroupTokenFunction"); 
// }
  
export const Or = (...tokenFunctions) => { 
    let hasSaved = false 
    let savingTfFunc = undefined
    let removed = []
   
    return TokenFunction.from(function({self, state, end}){
        const endCheck = () => { 
            //todo the fact that we're using 'end' logic here makes building token functions a potential mess. Hopefully this is only something we need to do in OR logic. 
            if(end == true) { 
                removed = []
            }
        }
        let shouldSave = false 
        for(const [i,tfFunc] of tokenFunctions.entries()) { 
            if(removed.includes(tfFunc)) continue; 
            if(removed.length >= tokenFunctions.length) {
                removed = []
                return TokenOperations.REJECT
            }; 

            let op = tfFunc.call({self, state, end})
            
            if(op == TokenOperations.REJECT) {
                removed.push(tfFunc)
                continue; 
            }
            if(op == TokenOperations.ACCEPT) {
                removed = []
                tfFunc.applyChangesTo(self)
                return TokenOperations.ACCEPT
            };
            if(op == TokenOperations.LOAD) {
                removed = [] //issue here?
                if(hasSaved == true) { 
                    tfFunc.applyChangesTo(self)
                    return TokenOperations.LOAD;
                }
            }
            if(op == TokenOperations.SAVE) {
                shouldSave = true 
                savingTfFunc = tfFunc
            }
        }
        if(shouldSave == true) { 
            if(end == true && savingTfFunc != undefined) {
                savingTfFunc.applyChangesTo(self)
            }
            endCheck()
            hasSaved = true
            return TokenOperations.SAVE
        }
        endCheck()
        return TokenOperations.NEXT
    })
}

export const Space = (optional=false) => { 
    return TokenFunction.from(({state}) => { 
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
    return TokenFunction.from(({state, self}) => {
        if(state == undefined) debugger;
        const last = state[state.length-1]
        if(typeof(last) != "object") return TokenOperations.REJECT
        if(last.type != type) return TokenOperations.REJECT
        return TokenOperations.ACCEPT
    }) 
}

export const StringMatch = (str) => { 
  return TokenFunction.from(({state}) => { 
        //const {state, self} = wtf; 
      if(state.join("") == str) { 
          return TokenOperations.ACCEPT; 
      }  
          
      if(state.length >= str.length) { 
          return TokenOperations.REJECT
      }
  
      //DO NOT use SAVE here, SAVE=Accept but next token might be valid too, SAVE != MAYBE ACCEPTABLE 
      return TokenOperations.NEXT; 
      
  }).setFunctionName(`StringMatch(${str})`).join() 
}



export const Alphabetical = () => { 
  return TokenFunction.from(({state})=>{
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

export const Alphanumeric = () => { 
    return TokenFunction.from(({state})=>{
        const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("")
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
  return TokenFunction.from(({state})=>{
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


export const AllowOnly = (charsInString="") => { 
    // return TokenFunction.from(({state})=>{
    //     const allowedArray = charsInString.split("")
    //     for(const stateToken in state) { 
    //         if(allowedArray.includes(stateToken) == false) { 
    //             return TokenOperations.REJECT
    //         }
    //     }
    // })
}
export const StringMatch2 = (str) => { 
    // return TokenFunction.from(({state}) => { 
    //     const required = str.split("")
    //     const view = [...state]

    //     let valid = true 
    //     for(const [vi, vn] of view.entries()) { 
    //         const rn = required[vi] 
    //         if(rn != vn) { 
    //             valid = false 
    //         }
    //     }

    //     console.log(valid) 
    // })
}

export const OrGroup = (...tokenFunctions) => { 
    const lastTokenFunction = tokenFunctions[tokenFunctions.length-1]

    const success = [TokenOperations.ACCEPT, TokenOperations.LOAD]
    const failure = [TokenOperations.REJECT]

    const skipToLast = (context, {self}) => { 
        //skip to after last IF success 
        if(success.includes(context.operationEvaluation)) { 
            context.shiftToTokenFunction(lastTokenFunction, 1)
        } 
    }
    const setToOptional = (context, {self}) => { 
        //set self to optional if fail (or just set all to optional except the last)
        if(failure.includes(context.operationEvaluation)) { 
            self.opt()
        }
    }

  

    for(const tf of tokenFunctions) { 
        if(tf != lastTokenFunction) { 
            tf.opt()
            tf.on(success, skipToLast)
            //tf.on(failure, setToOptional)
        } 
    }

    return Group(...tokenFunctions)
    
}