import process from "process"

export function segmentReplace(segArray, selectionVec, replacement) { 
    let newSegArray = []
    for(const seg of segArray) { 
        let newSeg = []
        if(typeof(seg) == "string") { 
            if(seg.length > 1) { 
                newSeg = seg.split("")
            } else { 
                newSeg = seg 
            }
        }
        if(typeof(seg) == "object") { 
            newSeg = [seg] 
        }
        newSegArray = [...newSegArray, ...newSeg]
    }


    if(selectionVec.length != 2) {
        throw new Error("Selection vector is not equal to 2; Doesnt make sense")
    }

    if(!Array.isArray(replacement)) { 
        replacement = [replacement]
    }
    let retSegArray = [
        ...newSegArray.slice(0, selectionVec[0]),
        ...replacement, 
        ...newSegArray.slice(selectionVec[1], newSegArray.length)
    ]

    //compress all the chars into strings 
    const compress = true 
    if(compress == true) { 
        const compressedSegArray = []
        const objectIndexes = []
        retSegArray.forEach( (ele, i) => {
            if(typeof(ele) == "object") { 
                objectIndexes.push(i)
            }
        })

        let last = 0 
        for(let i = 0; i < objectIndexes.length; i++) { 
            let _index = objectIndexes[i]
            let obj = retSegArray[_index]
            const compressedString = retSegArray.slice(last, _index).join("")
            if(compressedString.length > 0) compressedSegArray.push(compressedString)
            compressedSegArray.push(obj)

            last = _index + 1 
        }


        //apparently this fixes stuff even after verifying this doesnt do anything via testing? even tho it makes sense to put this condition here 
        if(last < retSegArray.length) { 
            let lastCompressedString = retSegArray.slice(last, retSegArray.length).join("")
            compressedSegArray.push(lastCompressedString)
        }

        

        retSegArray = compressedSegArray
    }

   // console.log("IN FUNC", retSegArray, segArray, selectionVec, replacement)
    



    return retSegArray


}
// const segs = segmentReplace(
//     [
//         'print',
//         {
//           type: 'call',
//           value: { type: 'string', contents: '"End of program"' }
//         }
//     ],
//     [0,6], 
//     "this should work"
// )
// console.log("segs=", segs)
// process.exit()


/**
 * 
 * split("I have many bees in my boots", 12, 16, (str)=>{
 *   return {
 *       type: "animal", 
 *       inner: str 
 *   }
 * })
 * 
 * @param {*} str 
 * @param {*} pointA 
 * @param {*} pointB 
 * @param {*} func 
 * @returns 
 * 
 * The point coords in the arrays cannot overlap.
 */
export function split(str, pointArrays, func) { 
    if(pointArrays.length <= 0) return str
    //filter the points 
    let newPointArrays = []
    for(let pArr of pointArrays) { 
        if(pArr.length == 2) { 
            pArr = pArr.sort( (a,b) => a-b)
            newPointArrays.push(pArr)
        }
    }

    //ignore point group intersections, if they happen thats user error 
    //and calculating that would be a little computationally expensive 

    //run the strings through provided function 
    const funcReturnsData = []
    for(const pArr of pointArrays) { 
        const pArrStr = str.substring(pArr[0], pArr[1]);
        const funcReturn = func(pArrStr, pArr)
        funcReturnsData.push({
            position: pArr[0], 
            funcReturn,
            type: 0 //data
        })
    }

    //merge the funcReturns with the other parts of  the string 

    //invert the pointarrays 
    let inverted = pointArrays.reduce( (a, c) => {
        return [...a, ...c]
    })
    if(inverted[0] == 0) { 
        inverted.splice(0,1)
    } else { 
        inverted = [0, ...inverted]
    }
    if(inverted[inverted.length-1] != str.length) { 
        inverted.push(str.length)
    }
    if(inverted.length % 2 != 0) { 
        inverted.pop() 
    }
    let newInverted = []
    for(let i = 0; i < inverted.length; i += 2) { 
        newInverted.push([inverted[i], inverted[i+1]])
    }
    inverted = newInverted 
    //resolve the inverted point arrays to strings 
    const invertedData = []
    for(const invertedPoints of inverted) { 
        invertedData.push({
            position: invertedPoints[0], 
            str: str.substring(invertedPoints[0], invertedPoints[1]),
            type: 1 // string 
        })
    }

    let combinedSegmentes = [...invertedData, ...funcReturnsData]
    combinedSegmentes.sort( (a,b) => a.position - b.position)
    combinedSegmentes = combinedSegmentes.map( ele => { 
        let ret = undefined 
        if(ele.type == 1) ret = ele.str
        if(ele.type == 0) ret = ele.funcReturn

        return ret 
    })

    
    return combinedSegmentes
}


// console.log(split(
//     "Liam-and-I-like-cheese-my-dude!!",
//     [[0,4],[16,22]], 
//     function(substr) { 
//         return {STRING:substr}
//     }
// ))


export function captureStrings(segments) { 
    const newSegments = []
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
    return newSegments

}

export function findAndSegment(segments, tokenTypes, func) { 


    while(true) { 
        const defaultState = { 
            satisfied: false,
            satisfiedState: undefined, 
            wasSatisfied: false, 
            lastSatisfiedSelectionStart: undefined, 
            lastSatisfiedSelectionEnd: undefined 
        }
        const satisfiedTokenTypes = tokenTypes.map(tt => {
            return { 
                tokenType: tt, 
                ...defaultState
            }   
        })

        let stringExpandedSegents = []
        for(const segment of segments) { 
            if(typeof(segment) == "string") { 
                stringExpandedSegents = [...stringExpandedSegents, ...segment.split("")]
            }
            if(typeof(segment) == "object") { 
                stringExpandedSegents.push(segment)
            }
        }


        let selectedTokenTypeIndex = 0 
        let initialStartIndex = 0
        let startStringIndex = initialStartIndex 
        let total = []
        

    
        for(let endStringIndex = startStringIndex + 1; endStringIndex <= stringExpandedSegents.length; endStringIndex++) { 
            // console.log("LOOP START", satisfiedTokenTypes)
            const selectedTokenType = satisfiedTokenTypes[selectedTokenTypeIndex]
            if(selectedTokenTypeIndex >= satisfiedTokenTypes.length) /*All token types satisfied?*/ break; 
            // console.log("THE INDEX", selectedTokenTypeIndex)
            total = stringExpandedSegents.slice(startStringIndex, endStringIndex)
            
            // console.log("NEW TOTAL", total)
            // console.log(">>", total.join(" "))
            let validator = selectedTokenType.tokenType 
            let infoObject = undefined 
            let truthFunction = undefined 
            if(typeof(validator) == "object") { 
                infoObject = validator
                validator = infoObject.validator
                truthFunction = infoObject.truthFunction
            }
            const result = validator(total, total[total.length-1])

            selectedTokenType.satisfied = result 

            const reset = () => { 
                // console.log("resetting")
                // startStringIndex = endStringIndex - 1//CHANGE -1
                startStringIndex = initialStartIndex+1
                initialStartIndex++ 
                endStringIndex = startStringIndex
                
                selectedTokenTypeIndex = 0 
                for(const t of satisfiedTokenTypes) { 
                    t.satisfied = false 
                    t.wasSatisfied = false 
                    t.satisfiedState = undefined //#todo append default state object to avoid duplicate logic 
                    t.lastSatisfiedSelectionStart = defaultState.lastSatisfiedSelectionStart 
                    t.lastSatisfiedSelectionEnd = defaultState.lastSatisfiedSelectionStart 
                }
            }
            

            if(result == true) {
                // console.log("SATISFIED", selectedTokenType.tokenType, total, total[total.length-1], startStringIndex, endStringIndex)
                selectedTokenType.wasSatisfied = true 

                selectedTokenType.lastSatisfiedSelectionStart = startStringIndex
                selectedTokenType.lastSatisfiedSelectionEnd = endStringIndex
                
            } else { 
                // console.log("NOT SATISFIED", selectedTokenType.tokenType, total, total[total.length-1], startStringIndex, endStringIndex)
            }

            //matched? move to next token match
            let isLast = selectedTokenType.wasSatisfied == true && (endStringIndex) >= stringExpandedSegents.length
            if((selectedTokenType.wasSatisfied == true && selectedTokenType.satisfied == false)
                || (isLast) /*End of for*/) { 
                    
                let cut = total.slice(0, isLast ? total.length : total.length-1)
                if(truthFunction != undefined && truthFunction(cut) == false) { 
                    reset() 
                    continue 
                }
                // console.log("MATCH", selectedTokenType.wasSatisfied == true && selectedTokenType.satisfied == false, selectedTokenType.wasSatisfied == true && (endStringIndex) >= stringExpandedSegents.length)
                selectedTokenType.satisfiedState = cut
                // console.log
                endStringIndex -= 1; 
                selectedTokenTypeIndex++; 
                startStringIndex = endStringIndex;
                continue; 
            }

            //current token not matching with tokenmatch, reset tokenmatch progress and start again from next token 
            if(selectedTokenType.wasSatisfied == false && selectedTokenType.satisfied == false) { 
                reset() 
                continue; 
            }
            // console.log("NEXT LOOP")
            //can get to this point is all satisfied, then endindex++
           // console.log("??", total, selectedTokenType.wasSatisfied, selectedTokenType.satisfied)//should not get to this point really, unaccounted for case in the loop 
        
        } 
        // console.log("YA MAN", satisfiedTokenTypes)  
        const satisfied = satisfiedTokenTypes.every(ele => ele.wasSatisfied)

        if(satisfied == true) { 
            // console.log("R FUNCTION SUPPLIED WITH", satisfiedTokenTypes)
            const replacementSegment = func(satisfiedTokenTypes)
            // console.log("REPLACEMENT SEGMENT =", replacementSegment)
            const replacementStartIndex = satisfiedTokenTypes.map(v => v.lastSatisfiedSelectionStart).sort( (a,b) => a-b)[0]
            const replacementEndIndex = satisfiedTokenTypes.map(v => v.lastSatisfiedSelectionEnd).sort( (a,b) => b-a)[0]
            // console.log("$$", replacementStartIndex, replacementEndIndex)
        
            // console.log("SEG REPLACE BEFORE ", segments, replacementStartIndex,replacementEndIndex)
            const segs = segmentReplace(
                segments,
                [replacementStartIndex,replacementEndIndex], 
                replacementSegment
            )
            segments = segs //restart the process on the new segment array
            // console.log("SEG REPLACE RETURNED ", segs)
            continue 
        } else { 
            break //out of while loop if nothing was satisfied 
        }
    }
    return segments 
    
    // console.log("segs=", segs)

    
    //#TODO #NEXT WE NEED TO REWRITE SPLIT TO TAKE IN AN ARRAY OF CHARACTERS AND OBJECTS, INSTEAD OF JUST A STRING LIKE IT DOES NOT.

    // console.log(stringExpandedSegents)
    // console.log("??", satisfiedTokenTypes[1].tokenType("James".split("").push({}), {}))
    //console.log("replacement should be", replacement)
}

