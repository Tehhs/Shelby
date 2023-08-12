import { compactSegments, expandSegments, multiSegmentReplace, split } from "./internal.js"
import fs from 'fs'

export const TokenOperations = {
    IGNORE: "IGNORE", //ignore tokenFunction, go to next TokenFunction
    SAVE: "SAVE", 
    LOAD: "LOAD",
    ACCEPT: "ACCEPT",
    REJECT: "REJECT" 
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

                const replObj = {
                    type: typeName
                }

                for(const satisfiedTfFunctionData of tListing.satisfiedTokenFunctions) { 
                    const tfFunc = satisfiedTfFunctionData.tfFunc 
                    if(tfFunc.name != undefined) { 
                        replObj[tfFunc.getName()] = satisfiedTfFunctionData.state
                        
                        console.log("PINEAPPLE", tfFunc )
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
                    if(endIndex >= eSegments.length) { 
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
        //the for loop ends before it runs this duplicated code 
        if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) {
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
}




