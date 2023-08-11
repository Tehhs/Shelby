import { TokenOperations, TokenFunction } from "./Engine.js";

export const StringMatch = (str) => { 
  return TokenFunction.from((state) => { 
      if(state.join("") == str) { 
          return TokenOperations.ACCEPT; 
      }  
          
      if(state.length > str.length) { 
          return TokenOperations.REJECT
      }
  
      return TokenOperations.SAVE; 
      
  }).setFunctionName(`StringMatch(${str})`)
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
