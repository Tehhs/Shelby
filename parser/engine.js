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
                    //if(tfFunc.pushKey != undefined) debugger; 

                    let tfFuncStateArray = satisfiedTfFunctionData.state != undefined 
                        ? [...satisfiedTfFunctionData.state] : []

                    //! Probably need to move this if we no longer support state transformers 
                    if(tfFunc.stateTransformer != undefined) { 
                        tfFuncStateArray = tfFunc.stateTransformer([...tfFuncStateArray])
                    }

                    //todo join changes tfFuncStateArray type from array to string, might cause issues 
                    //turn state into string type if need be 
                    if(tfFunc._join == true) { 
                        console.log("TRYING", tfFuncStateArray, typeof(tfFuncStateArray))
                        tfFuncStateArray = tfFuncStateArray.join("")
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

        //flatten the array 
        TokenFunctions = TokenFunctions.flat(Infinity); 

        //check to make sure all "TokenFunctions" are indeed instanceof TokenFunction 
        for(const tf of TokenFunctions) { 
            if( !(tf instanceof TokenFunction) ) { 
                throw new Error(`${tf} is not a TokenFunction`)
            }
        }

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
        
        let rejected = false 
        for(startIndex = 0; startIndex < eSegments.length; startIndex++) { 

            for(let endIndex = startIndex + 1; endIndex <= eSegments.length; endIndex++) { 

                const EventContext = { 
                    newTokenFunctionRequirement
                }
                
                const endOfLoop = endIndex >= eSegments.length
                if(tokenFunctionsIndex >= satisfiedTokenFunctions.length) {
                    completedSets = [...completedSets, satisfiedTokenFunctions]
                    startIndex = endIndex - 1
                    tokenFunctionsIndex = 0 
                    setTokenFunctionsDefault() 
                }; 
                const subExtendedSegments = eSegments.slice(startIndex, endIndex)

                let currentTokenObject = satisfiedTokenFunctions[tokenFunctionsIndex]
                if(currentTokenObject == undefined) { 
                    debugger 
                }
                let satisfyFunction = currentTokenObject.func

                if(satisfyFunction == undefined) {
                    debugger;
                }
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

        //values we dont want cloned 
        this.pushKey = undefined 
        this.tags = []

        //probably should just use NodeJS Event handler but I love programming things on my own so idc
        //[..., {eventName: 'eventName', func: () => {} }]
        this.installedEvents = []
    }
    clone() { 
        const clone = new TokenFunction()
        return this.applyTo(clone); 
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

    static from(func) { 
        const newTokenFunction = new TokenFunction() 
        newTokenFunction._func = func
        return newTokenFunction
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
        return this 
    }

    call(...args) { 
        return this._func.bind(this)(...args)
    }

    shift(shift) { 
        this._shift = shift 
        return this 
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

    delete(shouldDelete=true) { 
        this._delete = shouldDelete
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

    join(join=true) { 
        this._join = join 
        return this 
    }

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

        // Object mapping 
        const outputObject = {...originObject}

        // Object mapping - renaming keys 
        if(this.rename != undefined) { 
            const value = mergingObject[this.key]


            // Handle pushes to arrays 
            if(this.shouldPush == true) { 
                if(Array.isArray(outputObject[this.newKey]) == false) { 
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
// const newObj = select("name").rename("_name").push(true).map(
//     {age: 25, _name: ["alex"]},
//     {name: "liam"}
// )
// console.log(">>", newObj)