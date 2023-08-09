import { split } from "./parser_functions.js"

export const TokenOperations = {
    IGNORE: "IGNORE", //ignore tokenFunction, go to next TokenFunction
    SAVE: "SAVE", 
    LOAD: "LOAD",
    ACCEPT: "ACCEPT",
    REJECT: "REJECT" 
}

export class SegmentList { 

    segments = []
    constructor(list) { 
        this.append(list) 
    }

    append(list) { 
        if(list instanceof SegmentList) { 
            this.segments = [...this.segments, ...list.segments]
        }
        if(!Array.isArray(list)) { 
            this.segments = [list]
        }
        this.segments = list
    }

    clear() { 
        this.segments = []
    }

    copy(segmentList) { 
        this.clear() 
        this.append(segmentList)
    }
    
    replace(start, end, _replacement) { 
        if(!Array.isArray(_replacement)) { 
            _replacement = [_replacement]
        }
        this.segments = [
            ...this.segments.slice(0, start),
            ..._replacement,
            ...this.segments.slice(end, this.segments.length)
        ]
        return this.segments 
    }

    processStrings() { 
        const newSegments = []
        let segments = [...this.segments]
        for(const segment of segments) { 
            const groups = []
            if(typeof(segment) != "string") { 
                newSegments.push(segment)
                continue 
            }
            let str = segment
            let first = undefined 
            let second = undefined
            let previousChar = undefined
            for(let i = 0 ; i < str.length; i++) { 
                const char = str.charAt(i);
    
                if(!(previousChar != "\\" && char == "\"")) { 
                    previousChar = char; 
                    continue; 
                }
    
                if(first == undefined) { 
                    first = i 
                } else if(second == undefined) { 
                    second = i + 1
                    groups.push([first,second])
                    first = undefined 
                    second = undefined 
                    previousChar = undefined 
                } else { 
                    previousChar = char; 
                }
            }
            //console.log("groups", groups)
    
            const render = split(
                segment,
                groups, 
                function(substr) { 
                    return {
                        type: "string", 
                        contents: substr
                    }
                }
            )
            for(const r of render) { 
                newSegments.push(r) 
            }
    
        }
        this.segments = newSegments
    
    }

    transform(name) { 

    }

    find(TokenFunctions) { 
        const eSegments = this._getExpandedSegents()

        let satisfiedTokenFunctions = []
        function setTokenFunctionsDefault() { 
            satisfiedTokenFunctions = TokenFunctions.map(tf => { 
                return { 
                    satisfied: false,
                    func: tf, 
                    state: undefined, 
                    cutStart: undefined, 
                    cutEnd: undefined 
                }
            })
        }
        setTokenFunctionsDefault() 

        let startIndex = 0
        let tokenFunctionsIndex = 0 
        let tempState = []
        let tempStateCutLocations = []

        function getCurrentTokenFunction() { 
            return satisfiedTokenFunctions[tokenFunctionsIndex]
        }
        function saveState(state , cutStart, cutEnd) { 
            getCurrentTokenFunction().state = [...state]
            getCurrentTokenFunction().cutStart = cutStart 
            getCurrentTokenFunction().cutEnd = cutEnd 
        }
        function satisfy(satisfied=true) { 
            getCurrentTokenFunction().satisfied = satisfied
        }
        function nextTokenFunction() { 
            if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) { 
                return false 
            }; 
            tokenFunctionsIndex++ 
            return true
        }
        function reset(resetTokenFunctionIndex=false) { 
            tempState = []
            tempStateCutLocations = []
            if(resetTokenFunctionIndex) { 
                tokenFunctionsIndex = 0 
            }
        }
        
        let rejected = false 
        for(startIndex = 0; startIndex < eSegments.length; startIndex++) { 

            for(let endIndex = startIndex + 1; endIndex < eSegments.length; endIndex++) { 
                const subExtendedSegments = eSegments.slice(startIndex, endIndex)

                

                if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) break; 
                let currentTokenObject = satisfiedTokenFunctions[tokenFunctionsIndex]
                let satisfyFunction = currentTokenObject.func

                let tokenOperation = satisfyFunction(subExtendedSegments)
                if(tokenOperation == undefined) { 
                    throw new Error("Got Undefined TokenOperation")
                }

                if(tokenOperation == TokenOperations.LOAD) { 
                    saveState(tempState, startIndex, endIndex)
                    satisfy() 
                    nextTokenFunction() 

                    tempState = []
                    tempStateCutLocations = [] 

                    startIndex = endIndex
                    continue
                }

                if(tokenOperation == TokenOperations.SAVE) { 
                    tempState = [...subExtendedSegments]
                    tempStateCutLocations = [startIndex, endIndex]
                    continue 
                }

                //ignore this token and reset, for optional,
                //skip the optional token 
                if(tokenOperation == TokenOperations.IGNORE) { 
                    satisfy() 
                    nextTokenFunction() 
                    reset() 

                    endIndex = startIndex
                    tokenFunctionsIndex++ 
                    continue 
                }

                //ACCEPT AND PROCESS THE CURRENT TOKEN 
                if(tokenOperation == TokenOperations.ACCEPT) { 
                    saveState([...subExtendedSegments], startIndex, endIndex)
                    satisfy() 
                    nextTokenFunction() 
                    reset() 

                    startIndex = endIndex
                    continue 
                }

                //ACCEPT AND PROCESS THE CURRENT TOKEN 
                if(tokenOperation == TokenOperations.REJECT) { 
                    reset(true) 
                    setTokenFunctionsDefault() 
                    break
                }

            }
        }
        console.log(satisfiedTokenFunctions)
    }
    

    _getExpandedSegents() { 
        let expandedSegmentArray = []
        for(const seg of this.segments) { 
            if(typeof(seg) == "string") { 
                expandedSegmentArray = [...expandedSegmentArray, ...seg.split("")]
            } else { 
                expandedSegmentArray.push(seg)
            }
        }
        return expandedSegmentArray
    }
    
}

export class TokenFunction { 
    constructor() { 
        this._func = undefined 
        this._name = undefined 
        this._propagate = false 
    }

    static from(func) { 
        const newTokenFunction = new TokenFunction() 
        newTokenFunction._func = func
        return newTokenFunction
    }

    call(...args) { 
        return this._func.bind(this)(...args)
    }

    setFunc(func) { 
        if(typeof(func) != 'function') { 
            throw new Error("Type is not function")
        }
        this._func = func 
    }

    name(name) { 
        this._name = name 
        return this 
    }

    propagate(tf=true) { 
        this._propagate = tf 
        return this 
    }

    call(...args) { 
        if(typeof(this._func) != 'function') { 
            throw Error("Tried to fire non function type; Got " + this._func)
        }
        return this._func.bind(this)(...args)
    }
}


const sList = new SegmentList(); 
sList.append(["My name is ", {name: "Liam"}, "Liam"])
sList.find([(total)=>{
    if(total.join("") == "name") { 
        return TokenOperations.ACCEPT; 
    }  
        
    if(total.length > 4) { 
        return TokenOperations.REJECT
    }

    return TokenOperations.SAVE; 
}]) 