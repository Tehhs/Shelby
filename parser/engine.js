import { compactSegments, expandSegments, multiSegmentReplace, split } from "./internal.js"
import fs from 'fs'

/**
 * This needs to be document because I keep forgetting what this signals even mean
 * SAVE = The current state is acceptable (and will be accepted on end of input) BUT future input/state
 *  might be also acceptable. So SAVE saves the state and moves forward with input. This might be useful
 *  for capturing state for input you can't exactly string match for. Like alphanumeric input captures.
 * 
 * LOAD = Load takes the previously captured state and accepts it for processing by that token function. 
 * 
 * ACCEPT = Takes the current literal input and accepts that for processing by current token function. 
 * 
 * REJECT = Do not accept current input, reject the entire token function set. No input is transformed.
 * 
 * NEXT = Similar to save, as it moves forward in the input BUT it doesn't save anything for later acceptance.
 * 
 * It's important to understand that SAVE does not mean the input it MAYBE acceptable. SAVE means the current 
 * input IS acceptable, but future input might also be acceptable to we're not exactly saving the current 
 * input at the current point in the input. 
 * So basically: SAVE=Accept but next token might be valid too, SAVE != MAYBE ACCEPTABLE 
 * 
 */
export const TokenOperations = {
    // IGNORE: "IGNORE", //Replaced by setting the token function to optional
    SAVE: "SAVE", 
    LOAD: "LOAD",
    ACCEPT: "ACCEPT",
    REJECT: "REJECT",
    NEXT: "NEXT" //kinda like save, but SAVE ends up loading on end of input, NEXT should not have that issue and should be used with ACCEPT OR REJECT, NO LOAD 
}

export const EngineEvents = { 
    PARSER_BEGIN: "PARSER_BEGIN",
    OPERATION_EVALUATED: "OPERATION_EVALUATED"
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
                    let tfFunc = satisfiedTfFunctionData.tfFunc 
                    // if(tfFunc._delegate == true) { 
                    //     tfFunc = tfFunc._delegation == undefined ? tfFunc : tfFunc._delegation
                    // }
                    //if(tfFunc.pushKey != undefined) debugger; 

                    let tfFuncStateArray = satisfiedTfFunctionData.state != undefined 
                        ? [...satisfiedTfFunctionData.state] : []

                    //Can sometimes happen with optional tfFunctions that hasn't matched, which means 0 state 
                    if(tfFuncStateArray.length <= 0) continue; 

                    //! Probably need to move this if we no longer support state transformers 
                    if(tfFunc.stateTransformer != undefined) { 
                        tfFuncStateArray = tfFunc.stateTransformer([...tfFuncStateArray])
                    }

                    //todo join changes tfFuncStateArray type from array to string, might cause issues 
                    //turn state into string type if need be 
                    if(tfFunc._join == true) { 
                        console.log("TRYING", tfFuncStateArray, typeof(tfFuncStateArray))
                        tfFuncStateArray = tfFuncStateArray.join("")
                        // tfFuncStateArray = compactSegments(tfFuncStateArray) // should handle objects too but doesnt return string, returns array which is ugly 
                        console.log("done? ", tfFuncStateArray)
                    }

                    //remove type of inner objects?
                    for(const obj of tfFuncStateArray) { 
                        if(typeof(obj) !== 'object') continue 
                        delete obj.type 
                    }

                    // Setting value to key name 
                    if(tfFunc.getName() != undefined) { 
                        replObj[tfFunc.getName()] = tfFuncStateArray
                    }

                    if(tfFunc.pushKey != undefined) { 
                        //debugger
                        if(Array.isArray(replObj[tfFunc.pushKey]) != true) { 
                            replObj[tfFunc.pushKey] = []
                        }
                        replObj[tfFunc.pushKey].push(tfFuncStateArray)
                    }

                    // Handling collapse 
                    if(tfFunc._collapse == true) { 
                        
                        const objectMappers = tfFunc.collapseObjectMappers
                        let resultObject = {...replObj}

                        // Instead of combining siblings first and then merging with parent, 
                        // We're going to directly merge every sibling with the parent 
                        for(const objMapper of objectMappers) { 
                            for(const token of tfFuncStateArray) { 
                                //We're handling strings too here, it's up to the object mapper to reject strings 
                                const newResultObject = objMapper.map(resultObject, token)
                               
                                resultObject = {...newResultObject}
                            }
                        }

                        replObj = {...replObj, ...resultObject}

                    }

                    //Delete values and objects marked for deletion 
                    if(tfFunc._delete == true) { 
                        delete replObj[tfFunc._name]
                        //not sure if i want to delete arrays here too 
                        // delete replObj[tfFunc._pushKey]
                    }

                    
                }

                // Return the array for the transformation of the actual segments 
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

        //some simple error checking for types 
        if(Array.isArray(TokenFunctions) !== true) { 
            throw new Error("TokenFunctions needs to be an array. Got " + typeof(TokenFunctions))
        }

        //Easy to enter undefined entries into array if you have more than one comma [...,,...]
        TokenFunctions = TokenFunctions.filter(tf => tf != undefined)

        //flatten the array //! Actually we dont really want arrays being inputted. If you need array, have a token function that acts as an array of other token functions 
        TokenFunctions = TokenFunctions.flat(Infinity); 

        //check to make sure all "TokenFunctions" are indeed instanceof TokenFunction 
        for(const tf of TokenFunctions) { 
            if( !(tf instanceof TokenFunction) ) { 
                throw new Error(`${tf} is not a TokenFunction`)
            }
        }
        //debugger
        //unfolding the token functions if they need to be unfolded 
        TokenFunctions = TokenFunctions.map(tf => {
            if(tf.getTokenFunctions().length > 0) { 
                return tf.unfold()
            } else { 
                return tf; 
            }
        }).flat(Infinity)

       
        const eSegments = expandSegments(this.segments)

        const TokenFunctionToTokenObject = (tf) => { 
            const newObj = { 
                satisfied: false,
                func: tf.getFunc(), 
                tfFunc: tf,
                state: undefined, 
                cutStart: undefined, 
                cutEnd: undefined 
            }
            return newObj
        }
        let satisfiedTokenFunctions = []
        function setTokenFunctionsDefault() { 
            satisfiedTokenFunctions = TokenFunctions.map(tf => { 
                return TokenFunctionToTokenObject(tf)
            })
        }
        setTokenFunctionsDefault() 

        function _error_if_not_type(the_type, param) { 
            if(param instanceof the_type) return; 
            throw new Error(`${param} not type ${the_type}`)
        }

        function getTokenFunctionObject(tokenFunction) { 
            if( (tokenFunction instanceof TokenFunction) == false) { 
                return undefined; 
            }
            for(const tokenObject of satisfiedTokenFunctions) { 
                if(tokenObject.tfFunc != tokenFunction) continue; 
                return tokenObject; 
            }
            return undefined; //duhh
        }
        function getTokenFunctionObjects(...tokenFunctions) { 
            return [...tokenFunctions.map(tf => getTokenFunctionObject(tf))]
        }

        let tokenFunctionObjectChanged = false; 
        function shiftToTokenFunctionIndex(index){ 
            if(index == undefined) { 
                index = tokenFunctionsIndex; 
            }
            tokenFunctionObjectChanged = true 
            tokenFunctionsIndex = index 
        }
        function tokenFunctionToIndex(tokenFunction) { 
            for(const [i, tokenObject] of satisfiedTokenFunctions.entries()) { 
                if(tokenObject.tfFunc == tokenFunction) { 
                    return i; 
                }
            }
            return undefined; 
        }
        function shiftToTokenFunction(tokenFunction, offset=0) { 
            _error_if_not_type(TokenFunction, tokenFunction)
            shiftToTokenFunctionIndex(tokenFunctionToIndex(tokenFunction)+offset)
            //ensure tokenFunctionIndex in bounds? Might not have to, because if out of bounds, then forces parse loop to close.
        }

        let startIndex = 0
        let tokenFunctionsIndex = 0 
        let tempState = []
        let tempStateCutLocations = []
        let completedSets = []

        const newTokenFunctionRequirement = (tf) => { 
            //ensure array
            if(Array.isArray(tf) != true) {
                tf = [tf]
            }
            //array to tokenfunctionobjects 
            let tfObjects = tf.filter(_tf => _tf != undefined).map( _tf => TokenFunctionToTokenObject(_tf) )

            satisfiedTokenFunctions = [
                ...satisfiedTokenFunctions.slice(0, tokenFunctionsIndex),
                ...tfObjects,
                ...satisfiedTokenFunctions.slice(tokenFunctionsIndex)
            ]
        }

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

        //Context/Params for event calls 
        let EventContext = { 
            newTokenFunctionRequirement,
            shiftToTokenFunction, 
            shiftToTokenFunctionIndex,
            tokenFunctionToIndex,
            tokenFunctionsIndex,
            tokenFunctionObjects: satisfiedTokenFunctions
        }

        //Parser begin events on the token functions; if new tokenFunctions added, call PARSER_BEGIN on them too 
        let TfsThatHaveCalledParserBegin = [] 
        while(true) { 
            let breakLoop = true
            for(const [tfoIndex, tfo] of satisfiedTokenFunctions.entries()) { 
                const tf = tfo.tfFunc
                if(tf == undefined) continue; 

                if(!TfsThatHaveCalledParserBegin.includes(tf)) { 

                    //!REALLY UGLY EFFECTIVE CODE. tokenFunctionsIndex needs to be changed here in case 
                    //!the event handler calls functions like newTokenFunctionRequirement() which uses 
                    //!tokenFunctionsIndex to work out where to place the new TokenFunction. 
                    //!Would be fixed by rewriting this entire function with functional style code? 
                    tokenFunctionsIndex = tfoIndex

                    tf.fire(EngineEvents.PARSER_BEGIN, EventContext)
                    TfsThatHaveCalledParserBegin.push(tf)

                    //restart the loop 
                    breakLoop = false 
                    break 
                }
            }
            if(breakLoop == true) { 
                break; 
            }
        }
        tokenFunctionsIndex = 0
        
       
        //let rejected = false 
        for(startIndex = 0; startIndex < eSegments.length; startIndex++) { 

            let restartLoop = false 
            for(let endIndex = startIndex + 1; endIndex <= eSegments.length; endIndex++) { 
               
                const endOfLoop = endIndex >= eSegments.length
                if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) {
                    completedSets = [...completedSets, satisfiedTokenFunctions]
                    startIndex = endIndex //- 1
                    tokenFunctionsIndex = 0 
                    setTokenFunctionsDefault() 

                    continue
                }; 
                const subExtendedSegments = eSegments.slice(startIndex, endIndex)

                let currentTokenObject = satisfiedTokenFunctions[tokenFunctionsIndex]
                if(currentTokenObject == undefined) { 
                    debugger //this can now happen as event listeners now can literally change the token function index 
                }

                if(currentTokenObject.tfFunc._debug == true) { 
                    debugger 
                }

                let satisfyFunction = currentTokenObject.func
                if(satisfyFunction == undefined) {
                    debugger;
                }
                if(subExtendedSegments == undefined) { 
                    debugger;
                }

                const atLastToken = (tokenFunctionsIndex+1) >= satisfiedTokenFunctions.length

                //debugger
                let tokenOperation = currentTokenObject.tfFunc.call({
                    state: subExtendedSegments, 
                    self: currentTokenObject.tfFunc,
                    end: endOfLoop
                })
                function changeTokenOperation(operation) {
                    if(operation == undefined) return; 
                    tokenOperation = operation
                }
                EventContext = { 
                    ...EventContext, 
                    operationEvaluation: tokenOperation,
                    changeTokenOperation
                }
                //debugger
                currentTokenObject.tfFunc.fire(EngineEvents.OPERATION_EVALUATED, EventContext)
                if(tokenFunctionObjectChanged == true) { 
                    //Restart the loop on the new TokenFunction 
                    tokenFunctionObjectChanged = false; 
                    endIndex -= 1 
                    continue 
                }
                //debugger
               
                if(tokenOperation == undefined) { 
                    throw new Error("Got Undefined TokenOperation")
                }

                if(tokenOperation == TokenOperations.LOAD) { 
                    if(tempState.length <= 0) { 
                        throw new Error("Tried to LOAD with no saved state. Probably no SAVE operation before LOAD")
                        //todo maybe there's a better way to handle this besides just throwing an error. 
                        //todo but then again if length <= 0 something is very wrong and probably should throw error 
                    }
                    saveState(tempState, tempStateCutLocations[0], tempStateCutLocations[1])
                    satisfy() 
                    nextTokenFunction() 
                    reset()

                    tempState = []
                    tempStateCutLocations = [] 

                    endIndex -= 1;
                    startIndex = endIndex

                    //fire LOAD event
                    currentTokenObject.tfFunc?.fire(TokenOperations.LOAD, EventContext)

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

                        //fire LOAD event
                        currentTokenObject.tfFunc?.fire(TokenOperations.LOAD, EventContext)
                    }

                    //fire SAVE event 
                    currentTokenObject.tfFunc?.fire(TokenOperations.SAVE, EventContext)

                    continue 
                }

                if(tokenOperation == TokenOperations.NEXT) { 
                    /*If we're at the last token, and the tfFunc is optional, and if we have another tf
                        func to evaluate, move onto next tfFunc
                    */
                    if(endOfLoop == true 
                        && currentTokenObject.tfFunc.isOptional() == true
                        && atLastToken == false 
                    ) { 
                        //move back and use input for next token, only if current is optional
                        satisfy() 
                        nextTokenFunction() 
                        endIndex = startIndex
                    } 

                    /*
                        If the operation is next but we're at the end of the loop, it needs to be treated as a 
                        reject. Pretty much a copy paste of the reject operation 
                    */
                   if(endOfLoop == true) { 
                        setTokenFunctionsDefault() 
                        reset(true) 
                        currentTokenObject.tfFunc?.fire(TokenOperations.REJECT, EventContext)
                        break
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

                    //fire ACCEPT event
                    currentTokenObject.tfFunc?.fire(TokenOperations.ACCEPT, EventContext)

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

                    //fire LOAD event
                    currentTokenObject.tfFunc?.fire(TokenOperations.REJECT, EventContext)
                    
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

export function Group(...tokenFunctions) { 
    return TokenFunction.Array(tokenFunctions)
}

export class TokenFunction { 
    constructor() { 
        //any changes here, make sure clone() copies the changes 
        this._func = undefined 
        this._name = undefined 
        this._propagate = false 
        this.functionName = undefined
        this._optional = false 
        this._collapse = false 
        this._join = false 
        this._shift = 0 
        this.stateTransformer = undefined 
        this.conversionMap = {}
        this.collapseObjectMappers = []
        this._delete = false 
        this._delegation = undefined 
        this._delegate = false 
        this._debug = false 
        this._changedProps = []
        this._tokenFunctions = []

        //values we dont want cloned 
        this.pushKey = undefined 
        this.tags = []

        //probably should just use NodeJS Event handler but I love programming things on my own so idc
        //[..., {eventName: 'eventName', func: () => {} }]
        this.installedEvents = []
    }

    addTokenFunction(tokenFunctions=[]) { 
        if(!Array.isArray(tokenFunctions)) tokenFunctions = [tokenFunctions]

        for(const tf of tokenFunctions) { 
            if(!(tf instanceof TokenFunction)) return 
            this._tokenFunctions.push(tf)
        }
    }

    getTokenFunctions() { 
        return this._tokenFunctions; 
    }

    getAppliedTokenFunctions() { 
        return this.getTokenFunctions(); 
    }

    unfold() { 
        let unfoldedTokenFunctions = [];
        for(const tf of this.getTokenFunctions()) { 
            if(tf.getTokenFunctions().length > 0) { 
                unfoldedTokenFunctions.push(tf.unfold());
            } else { 
                unfoldedTokenFunctions.push(tf);
            }   

        }
        return unfoldedTokenFunctions.flat(Infinity);
    }

    applyChangesTo(tokenFunction) { 
        if( !(tokenFunction instanceof TokenFunction)) { 
            throw new Error("Cannot apply TokenFunction changes to non-TokenFunction parameter: " + tokenFunction)
        }
        for(const propName of this._changedProps) { 
            const propValue = this[propName]
            if(Array.isArray(propValue)) { 
                tokenFunction[propName] = [...propValue]
            } else { 
                tokenFunction[propName] = propValue
            }
        }
        tokenFunction._changedProps = [...tokenFunction._changedProps, ...this._changedProps]
    }
    clone() { 
        const clone = new TokenFunction()
        return this.applyTo(clone); 
    }

    debug(shouldDebug=true) { 
        this._debug = shouldDebug 
        return this 
    }

    hasTag(tag) { 
        return this.tags.includes(tag) 
    }

    applyTo(tfFunc) { 
        tfFunc._func = this._func  
        tfFunc._name = this._name
        tfFunc._propagate = this._propagate 
        tfFunc.functionName = this._functionName
        tfFunc._optional = this._optional 
        tfFunc._collapse = this._collapse 
        tfFunc._join = this._join  
        tfFunc._shift = this._shift 
        tfFunc.stateTransformer = this.stateTransformer 
        tfFunc.pushKey = this.pushKey 
        tfFunc.collapseObjectMappers = [...this.collapseObjectMappers]
        tfFunc._delete = this._delete
        tfFunc._delegation = this._delegation
        tfFunc._delegate = this._delegate
        tfFunc._debug = this._debug
        tfFunc._changedProps = [...this._changedProps]

        tfFunc.installedEvents = [...this.installedEvents]
        
        return tfFunc 
    }

    /**
     * 
     * @returns {TokenFunction} placeholder TokenFunction to be replaced with self/this by other functions.
     */
    static self() { 
        const newTf = new TokenFunction() 
        newTf.tags.push('self')
        return newTf 
    }

    static empty() { 
        const newTf = TokenFunction.from(()=>{
            return TokenOperations.REJECT
        }).opt() 
        return newTf; 
    }

    static from(func) { 
        const newTokenFunction = new TokenFunction() 
        newTokenFunction._func = func.bind(newTokenFunction)
        return newTokenFunction
    }

    static Array(tokenFunctions) { 
        if(!Array.isArray(tokenFunctions)) tokenFunctions = [tokenFunctions]

        const newTokenFunction = new TokenFunction()
        newTokenFunction.addTokenFunction(tokenFunctions)
        return newTokenFunction;
    }
    
    //!THIS WORKS BUT WE NEED TO SAVE FUNC CALLS AND PARAM, AND USE THOSE TO APPLY CHANGES UP OR TOKEN FUNCTION CHAINS 
    _markedChanged(propName) { 
        if(propName == undefined) return; 
        if(this._changedProps.includes(propName)) return; 
        this._changedProps.push(propName)
    }

    _setConversionMap(conversionMap) { 
        this.conversionMap = conversionMap
    }
    /**
     * Combines all the objects in the token array, and collapses the function into the parent object.
     * If the conversion map is defined and the collapse argument == true, 
     * @param {ObjectMapper[]} objectMappers 
     */
    collapse(objectMappers=[]) { 
        // if(Array.isArray(objectMappers) != true) {
        //     throw new Error("Cannot collapse with array of ObjectMappers, got " + objectMappers)
        // }

        this._collapse = true
        for(const objectMapper of objectMappers) { 
            if( !(objectMapper instanceof ObjectMapper)) { 
                throw new Error(`${objectMapper} is not an ObjectMapper!`)
            }
        }
        this.collapseObjectMappers = [...objectMappers]
        this._markedChanged("collapseObjectMappers")
        
        return this 
    }

    /**
     * 
     * ! WARNING: Potential errors due to multiple functions delegating to same function. Need 
     * ! to check for delegations of same TokenFunction. Potentially need to clone the input 
     * ! delegation TokenFunction and then assign to this._delegation 
     * 
     * When the transformer deals with this TokenFunction, it will instead handle the 
     * TokenFunction we delegate to. Useful for Or operations where the Or TokenFunction
     * can delegate control over to the child TokenFunction the tokens have matched 
     * with. 
     * 
     * @param {TokenFunction} tokenFunction 
     */
    delegateTo(tokenFunction) { 
        if(tokenFunction == undefined) { 
            throw new Error("Cannot delegate to non-TokenFunction; got " + tokenFunction)
        }
        this._delegation = tokenFunction
    }

    /**
     * Signals to the transformer that the delegation should be respected 
     * @param {boolean} shouldDelegate 
     */
    delegate(shouldDelegate) { 
        this._delegate = shouldDelegate; 
    }

    /**
     * @deprecated
     * @param {*} shift 
     * @returns 
     */
    shift(shift) { 
        this._shift = shift 
        return this 
    }

    optional(optional=true) { 
        this._optional = optional
        this._markedChanged("_optional")
        return this 
    }
    opt(optional=true) { 
        this._markedChanged("_optional")
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
        this._markedChanged("_name")
        return this 
    }

    delete(shouldDelete=true) { 
        this._delete = shouldDelete
        this._markedChanged("_delete")
        return this 
    }

    getName() { 
        return this._name 
    }

    /**
     * ! Not sure if this is still in use, might need to check for this in the transformer.
     * @deprecated
     * @param {*} tf 
     * @returns 
     */
    propagate(tf=true) { 
        this._propagate = tf 
        return this 
    }

    call(...args) { 
        if(typeof(this._func) != 'function') { 
            throw Error("Tried to fire non function type; Got " + this._func)
        }
        if(args[0].state == undefined) { 
            throw new Error("call() called with incorrect arguments. Should be called with ({state}); got " + JSON.stringify(args))
        }
        args[0].self = this
        const newFunc = this._func.bind(this)
        const newOp = newFunc(...args)
        return newOp
    }

    setFunctionName(name=undefined) { 
        this.functionName = name 
        return this 
    }

    join(join=true) { 
        this._join = join 
        this._markedChanged("_join")
        return this 
    }

    /**
     * @deprecated
     * @param {*} func 
     * @returns 
     */
    transformState(func) { 
        this.stateTransformer = func; 
        return this 
    }

    on(eventNames, func) { 
        if(Array.isArray(eventNames) != true) {
            eventNames = [eventNames]
        }
        this.installedEvents.push({
            eventNames, 
            func 
        })
        return this 
    }

    fire(eventName, context) {
        for(const eventObj of this.installedEvents) { 
            if(eventObj.eventNames?.includes(eventName) && eventObj.func != undefined) {
                eventObj.func.bind(this)(context, {self:this})
            }
        }
    }

    push(_pushKey) { 
        if(typeof(_pushKey) != "string") { 
            throw new Error("TokenFunction.push() requires type string, got " + typeof(_pushKey))
        }
        this.pushKey = _pushKey
        this._markedChanged("pushKey")
        return this 
    }

}

export const select = (key) => { 
    return new ObjectMapper(key); 
}
export class ObjectMapper { 
    constructor(key) { 
        this.key = key 
        this.newKey = undefined
        this.shouldPush = false 
    }

    rename(newKey) { 
        this.newKey = newKey; 
        return this 
    }

    set(shouldSet=true) { 
        this.shouldPush = !shouldSet; 
        return this; 
    }

    push(shouldPush=true) { 
        this.shouldPush = shouldPush; 
        return this; 
    }

    map(originObject, mergingObject) { 
        // Can decide to handle non object types here if you want but for now we're not handling those 
        if(typeof(mergingObject) != 'object') return originObject; 


        // Error checking 
        for(const obj of [{type: "origin", obj: originObject}, {type: 'merger', obj: mergingObject}]) { 
            if(typeof(obj.obj) != 'object') { 
                throw new Error(`ObjectMapper.map() invalid argument; Param type '${obj.type}' got ` + obj.obj)
            }
        }
        if(this.key == undefined) { 
            throw new Error("ObjectMapper cannot do any mapping of any kind with undefined key.")
        }
        if(mergingObject[this.key] == undefined) { 
            return originObject; 
        }

        //debugger 

        // Object mapping 
        const outputObject = {...originObject}

        // Object mapping - renaming keys 
        if(this.rename != undefined) { 
            const value = mergingObject[this.key]

            // Handle pushes to arrays 
            if(this.shouldPush == true) { 
                if(outputObject[this.newKey] == undefined) {
                    outputObject[this.newKey] = [value]
                } else if (Array.isArray(outputObject[this.newKey]) == false) { 
                    outputObject[this.newKey] = [outputObject[this.newKey], value]
                } else { 
                    outputObject[this.newKey] = [...outputObject[this.newKey], value]
                }
            } else {
                outputObject[this.newKey] = value 
            }
            
        }


        


        return outputObject; 
    }
}

// console.log("TT")
// const newObj = select("aaa").rename("bbb").push(true).map(
//     {age: 25, _name: ["alex"]},
//     {name: "liam"}
// )
// console.log(">>", newObj)

// const tf1 = new TokenFunction()
// tf1.name("James")

// const tf2 = new TokenFunction()
// tf1.applyChangesTo(tf2)

// const tf3 = new TokenFunction()
// tf2.applyChangesTo(tf3)
// console.log(tf3._name)

// const tf1 = (new TokenFunction()).setFunctionName("tf1")
// const tf2 = (new TokenFunction()).setFunctionName("tf2")
// const tf3 = (new TokenFunction()).setFunctionName("tf3") 
// const tf4 = (new TokenFunction()).setFunctionName("tf4") 
// const tf5 = (new TokenFunction()).setFunctionName("tf5") 

// tf1.addTokenFunction(tf2)
// tf1.addTokenFunction(tf3)
// tf1.addTokenFunction(tf4)

// tf5.addTokenFunction(tf1)

// console.log(tf2.unfold())
