
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

export function segmentReplace(segArray, selectionVec, replacement) { 
    let newSegArray = []
    for(const seg of segArray) { 
        let newSeg = []
        if(typeof(seg) == "string") { 
            if(seg.length > 1) { 
                newSeg = seg.split("")
            } else { 
                newSeg = [seg] 
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