import { TokenFunction, TokenOperations } from "./Engine.js";

/**
 * 
 * @param {TokenFunction} conditionalTokenFunction 
 * @returns {ConditionalTokenFunctionGenerator}
 */
export const $if = (conditionalTokenFunction) => { 
  const generator = new ConditionalTokenFunctionGenerator();
  generator.setConditional(conditionalTokenFunction)
  return generator; 
}

class ConditionalTokenFunctionGenerator { 

  constructor() { 
    this.conditionalTokenFunction = undefined 
    this._then = [] 
    this._else = []
  }

  setConditional(conditionalTokenFunction) { 
    this.conditionalTokenFunction = conditionalTokenFunction
  }

  then(...tokenFunctionArray) { 
    this._then = tokenFunctionArray
    return this 
  }

  else(...tokenFunctionArray) { 
    this._else = tokenFunctionArray
    return this 
  }

  clone() { 
    const newGenerator = new ConditionalTokenFunctionGenerator()
    newGenerator._then = this._then 
    newGenerator._else = this._else 
    newGenerator.conditionalTokenFunction = this.conditionalTokenFunction
    return newGenerator
  }

  _transformSelfs(tokenFunctionList) { 
    return tokenFunctionList.map( tokenFunction => { 
      if(tokenFunction.hasTag("self")) { 
        return this.clone().end() 
      } else { 
        return tokenFunction
      }
    })
  }

  end() { 
    const success = [TokenOperations.ACCEPT, TokenOperations.LOAD]
    const fail = [TokenOperations.NEXT, TokenOperations.REJECT]

    //! need more ways to easily clone token functions, clone ONLY CHANGED props to another token function 
    // const newTokenFunction = TokenFunction.from((argObject)=>{
    //   const {self, state} = argObject 
    //   const retCode = this.conditionalTokenFunction.call(argObject)
    //   return retCode 
    // })
    
    const newTokenFunction = this.conditionalTokenFunction.clone()
    .on(success, (context, {self}) => { 
      context.newTokenFunctionRequirement(this._transformSelfs(this._then))
    }).on(fail, (context, {self}) => { 
      context.newTokenFunctionRequirement(this._transformSelfs(this._else))
    })

    return newTokenFunction 
  }
}