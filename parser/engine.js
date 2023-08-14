import { compactSegments, expandSegments, multiSegmentReplace, split } from "./internal.js"
import fs from 'fs'

export const TokenOperations = {
    // IGNORE: "IGNORE", //Replaced by setting the token function to optional
    SAVE: "SAVE", 
    LOAD: "LOAD",
    ACCEPT: "ACCEPT",
    REJECT: "REJECT",
    NEXT: "NEXT" //kinda like save, but SAVE ends up loading on end of input, NEXT should not have that issue and should be used with ACCEPT OR REJECT, NO LOAD 
}

export class TransformerListing { 
    constructor(start, end, tokenFunctionArray) { 
        this.start = start
        this.end = end
        this.satisfiedTokenFunctions = tokenFunctionArray 
    }
}
export class Transformer { 
    
    /**
     * 
     * @param {SegmentList} segmentList 
     */
    constructor(segmentList) { 
        this.listings = []
        this.segmentList = segmentList
    }
    
    /**
     * 
     * @param {TransformerListing[]} listings 
     */
    add(listings) { 
        if(Array.isArray(listings) == false) { 
            listings = [listings]
        }
        for(const listing of listings) { 
            if(!(listing instanceof TransformerListing)) { 
                throw new Error("Transformer.add() can only accept type TransformerListing")
            }
            this.listings.push(listing)
        }
        return this 
    }

    transform(typeName) { 
        //do the transformation 
        let eSegments = expandSegments(this.segmentList.segments)
        let transformedESegments = multiSegmentReplace(
            eSegments, 
            this.listings.map( tListing => { 

                let replObj = {
                    type: typeName
                }

                for(const satisfiedTfFunctionData of tListing.satisfiedTokenFunctions) { 
                    const tfFunc = satisfiedTfFunctionData.tfFunc 
                    if(tfFunc.getName() != undefined || tfFunc._collapse == true) { 
                        let tfFuncStateArray = [...satisfiedTfFunctionData.state]

                        //remove type of inner objects?
                        for(const obj of tfFuncStateArray) { 
                            if(typeof(obj) !== 'object') continue 
                            delete obj.type 
                        }

                        //if array size = 1, collapse array 
                        if(tfFuncStateArray.length <= 1) { 
                            tfFuncStateArray = tfFuncStateArray[0]
                        }

                        //turn state into string type if need be 
                        if(tfFunc._join == true) { 
                            tfFuncStateArray= tfFuncStateArray.join("")
                        }

                        //collapse object into parent object if need be 
                        if(tfFunc._collapse == true) { 
                            replObj = {...replObj, ...tfFuncStateArray}
                        }
                        else { 
                            replObj[tfFunc.getName()] = tfFuncStateArray
                        }

                        
                    }
                }

                return [
                    tListing.start, 
                    tListing.end, 
                    replObj
                ]
            }).filter(e => e != undefined)
        )

        return new SegmentList( compactSegments(transformedESegments) )
    }
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
        return this 
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
        return this 
    }

    filterEmptyStrings() { 
        this.segments = this.segments.filter(s => { 
            console.log("??", s )
            if(typeof(s) == "object") return true 
            if(typeof(s) == "string") {
                //todo should only filter empty strings not all strings, or maybe another function that throws errors of unprocessed strings
                return false 
            }
            return true 
        })
        return this; 
    }

    find(TokenFunctions) { 
        //check to make sure all "TokenFunctions" are indeed instanceof TokenFunction 
        for(const tf of TokenFunctions) { 
            if( !(tf instanceof TokenFunction) ) { 
                throw new Error(`${tf} is not a TokenFunction`)
            }
        }

        const eSegments = expandSegments(this.segments)

        let satisfiedTokenFunctions = []
        function setTokenFunctionsDefault() { 
            satisfiedTokenFunctions = TokenFunctions.map(tf => { 
                return { 
                    satisfied: false,
                    func: tf.getFunc(), 
                    tfFunc: tf,
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
        let completedSets = []

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

            for(let endIndex = startIndex + 1; endIndex <= eSegments.length; endIndex++) { 
                
                const endOfLoop = endIndex >= eSegments.length
                if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) {
                    completedSets = [...completedSets, satisfiedTokenFunctions]
                    startIndex = endIndex - 1
                    tokenFunctionsIndex = 0 
                    setTokenFunctionsDefault() 
                }; 
                const subExtendedSegments = eSegments.slice(startIndex, endIndex)

                let currentTokenObject = satisfiedTokenFunctions[tokenFunctionsIndex]
                let satisfyFunction = currentTokenObject.func

                let tokenOperation = satisfyFunction(subExtendedSegments)
                // debugger
                if(tokenOperation == undefined) { 
                    throw new Error("Got Undefined TokenOperation")
                }

                if(tokenOperation == TokenOperations.LOAD) { 
                    saveState(tempState, tempStateCutLocations[0], tempStateCutLocations[1])
                    satisfy() 
                    nextTokenFunction() 
                    reset()

                    tempState = []
                    tempStateCutLocations = [] 

                    endIndex -= 1;
                    startIndex = endIndex

                    continue
                }

                if(tokenOperation == TokenOperations.SAVE) { 
                    tempState = [...subExtendedSegments]
                    tempStateCutLocations = [startIndex, endIndex]

                    //if end of for loop, do the load operation 
                    if(endOfLoop == true) { 
                        saveState(tempState, tempStateCutLocations[0], tempStateCutLocations[1])
                        satisfy() 
                        nextTokenFunction() 
                        reset()

                        tempState = []
                        tempStateCutLocations = [] 

                        startIndex = endIndex
                    }

                    continue 
                }

                if(tokenOperation == TokenOperations.NEXT) { 
                    if(endOfLoop == true && currentTokenObject.tfFunc.isOptional() == true) { 
                        //move back and use input for next token, only if current is optional
                        satisfy() 
                        nextTokenFunction() 
                        endIndex = startIndex
                    } 
                    continue 
                    
                }

                //ignore this token and reset, for optional,
                //skip the optional token 
                if(tokenOperation == TokenOperations.IGNORE) { 
                    throw new Error("IGNORE TokenOperation no longer supported. Replaced by TokenFunction.optional(true)")
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

                //REJECT
                if(tokenOperation == TokenOperations.REJECT) { 

                    if(currentTokenObject.tfFunc.isOptional() == true) { 
                        //pretty much like an accept 
                        reset(false) 
                        satisfy() 
                        nextTokenFunction() 
                        endIndex--
                    } else { 
                        setTokenFunctionsDefault() 
                        reset(true) 
                        break
                    }
                    
                }

            }
        }
        
        //if the last tokenfunctions are optional (can return "IGNORE") at the end of input we need to 
        //run the below code block
        let lastTokensAreOptional = true
        for(let i = tokenFunctionsIndex; i < satisfiedTokenFunctions.length; i++) { 
            const satisfiedTfFuncData = satisfiedTokenFunctions[i]
            const optional = satisfiedTfFuncData.tfFunc.isOptional() 
            if(optional == false) { 
                lastTokensAreOptional = false; 
                break; 
            }
        }
        //the for loop ends before it runs this duplicated code 
        if(tokenFunctionsIndex >= satisfiedTokenFunctions.length || lastTokensAreOptional) {
            completedSets = [...completedSets, satisfiedTokenFunctions]
            tokenFunctionsIndex = 0 
            setTokenFunctionsDefault() 
        }; 

        //console.log(JSON.stringify(completedSets, null, " "))
        //fs.writeFileSync("./test_output.json", , {encoding: "utf-8"})

        //process the sets 
        let transformer = new Transformer(this) 
        for(let i = 0; i < completedSets.length; i++){ 
            let minBoundary = undefined, maxBoundary = undefined; 

            const set = completedSets[i] 
            for(let k = 0; k < set.length; k++) { 
                const sTokenFunction = set[k]
                if(minBoundary == undefined || sTokenFunction.cutStart < minBoundary) { 
                    minBoundary = sTokenFunction.cutStart
                }
                if(maxBoundary == undefined || sTokenFunction.cutEnd > maxBoundary) { 
                    maxBoundary = sTokenFunction.cutEnd
                }
            }
            console.log("::", minBoundary, maxBoundary)

            transformer.add(new TransformerListing(
                minBoundary, maxBoundary, set
            ))
        }

        return transformer
    }

    
    
}

export class TokenFunction { 
    constructor() { 
        this._func = undefined 
        this._name = undefined 
        this._propagate = false 
        this.functionName = undefined
        this._optional = false 
        this._collapse = false 
        this._join = false 
    }

    static from(func) { 
        const newTokenFunction = new TokenFunction() 
        newTokenFunction._func = func
        return newTokenFunction
    }

    /**
     * If the token is an object, this function marks the object to be collapsed into it's parent object.
     * @param {Boolean} collapse 
     */
    collapse(collapse=true) { 
        this._collapse = collapse
        return this 
    }

    call(...args) { 
        return this._func.bind(this)(...args)
    }

    optional(optional=true) { 
        this._optional = optional
        return this 
    }
    opt(optional=true) { 
        return this.optional(optional)
    }

    isOptional() { 
        return this._optional
    }

    setFunc(func) { 
        if(typeof(func) != 'function') { 
            throw new Error("Type is not function")
        }
        this._func = func 
    }
    getFunc() { 
        return this._func; 
    }

    name(name) { 
        this._name = name 
        return this 
    }

    getName() { 
        return this._name 
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

    setFunctionName(name=undefined) { 
        this.functionName = name 
        return this 
    }

    join(join) { 
        this._join = join 
        return this 
    }
}




