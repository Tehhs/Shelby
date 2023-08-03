import vm from "vm"
import { processParsed } from "./language/language.js"
import { captureStrings, split, findAndSegment, segmentReplace } from "./parser/engine.js"
import fs from "fs";


let strArray =    [`
   
`]
strArray = [fs.readFileSync("./input.shelby", {encoding: "utf-8"})]
// console.debug("Reading in...", strArray)



//strArray =    [`if age >= 20 then`]

/**
 * {type: "Variable Decl", value: {type: "String", contents: "Liam"}}
 * {type: "Variable Decl", value: {type: "Integer", contents: "25"}}
 * {type: "Conditional", condition: {}, if: [
 *  {type: "MethodCall", value: {type: "String", contents: ":name is old"}}
 * ], else: [
 *  {type: "MethodCall", value: {type: "String", contents: ":name is young!"}}
 * ]}
 */

//process all the strings 
const nSegments = captureStrings(strArray)
//replace all the bad formatting 
for(let i = 0; i < nSegments.length; i++) { 
    const ele = nSegments[i]
    if(typeof(ele) == "string") { 
        nSegments[i] = nSegments[i].split("\r").join(" ")
        nSegments[i] = nSegments[i].replaceAll("\n", " ");
    }
}
// console.log("nSegments", nSegments)

/**
 *  REALLY IMPORTANT, TRUE COULD MEAN "MAYBE", and FALSE MEANS "NO"
 * 
 * 
 * 
 * @param {*} total 
 * @param {*} newest 
 * @returns 
 */
const VARIABLE = (total, newest) => { 

    if(typeof(newest) != "string") return false 
    total = total.join("")
    if(total.includes(" ") || total.includes("!")) return false 

    // console.log("TRUE FOR " + total)
    return true 
}
const SPACER = (total, newest) => { 
    if(typeof(newest) != "string") return false 
    if(total.length == 0) return false 
    total = total.join("")
    if(total.replaceAll(" ", "").length != 0) return false 
    return true 
}
const VALUE = (total, newest) => { 
    
    if( (!isNaN(Number(newest)) && newest != " " && newest != "\n")/*only will work for integers*/) { 
        const wtf = total.join("")
        const n = Number(wtf)
        if(!isNaN(n)) {
            // console.log("RET T", wtf)
            return true 
        } else { 
            // console.log("RET C", wtf)
        }
    }

    if(typeof(newest) != "object") return false 
    if(total.length > 1) return false 
    total = total[0]
    if(total.type != "string" && total.type != "number" ) return false 
    
    return true 
}
const StringMatch = (str) => { 
    return (total, newest) => { 
        if(typeof(newest) != "string") return false 

        total = total.join("")
        for(let i = 0; i < total.length; i++) { 
            if(i >= str.length) break;
            if(total[i] != str[i]) return false; 
        }
        if(total.length > str.length) return false 

        return true 
    }
}
const TypeMatch = (type) => { 
    return (total, newest) => { 
        if(typeof(newest) != "object") return false 
        if(total.length > 1) return false 
        if(total[0].type != type) return false 

        return true 
    }
}
const FunctionType = VARIABLE

// const test = ":"
// console.log("LEMON JUICE", StringMatch(":")([...(test.split(""))], test.split("")[test.length-1]))
// process.exit()


let brandNewSegments = [...nSegments]

/**
 * Parse Variable Decl
 */
brandNewSegments = findAndSegment(brandNewSegments, [StringMatch(":"), VARIABLE, SPACER, VALUE], (thing)=>{ 
    return { 
        type: "var_decl",
        name: thing[1].satisfiedState.join(""),
        contents: `${thing[0].satisfiedState.join("")}${thing[1].satisfiedState.join("")}${thing[2].satisfiedState.join("")}${typeof(thing[3].satisfiedState[0]) == "object" ? thing[3].satisfiedState[0].contents : thing[3].satisfiedState.join("")}`,
        // variable_value: thing[3].satisfiedState[0].contents
        variable: typeof(thing[3].satisfiedState[0]) == "object" ? thing[3].satisfiedState[0] : {
            type: "number", 
            contents: Number(thing[3].satisfiedState.join(""))
        }
    }
})



/**
 * Method Calls 
 */
brandNewSegments = findAndSegment(brandNewSegments, [StringMatch("("), VALUE, StringMatch(")")], (thing)=>{ 
    // console.log("FUCK YOU DOMB ", thing[1].satisfiedState)
    return { 
        type: "tmp_call",
        value: thing[1].satisfiedState[0]
    }
})


/**
 * Method calls => Methods 
 */
brandNewSegments = findAndSegment(brandNewSegments, [FunctionType, TypeMatch("tmp_call")], (thing)=>{ 
    // console.log("FUCK YOU DOMB ", thing[1].satisfiedState)
    return { 
        type: "method_call",
        value: thing[1].satisfiedState[0],
        methodName: thing[0].satisfiedState.join(""),
    }
})

/**
 * Variable Expressions 
 */
brandNewSegments = findAndSegment(brandNewSegments, [VARIABLE, SPACER, StringMatch(">"), StringMatch("="), SPACER, VALUE], (thing)=>{ 
    return {  
        type: "expression",
        contents: `${thing[0].satisfiedState.join("")} >= ${thing[5].satisfiedState.join("")}`
    }
})
// console.log("BEFORE",brandNewSegments )
/**
 * Conditions 
 */
brandNewSegments = findAndSegment(brandNewSegments, [StringMatch("if"), SPACER, TypeMatch("expression"), SPACER, StringMatch("then")], (thing)=>{ 
    return {  
        type: "pre_conditional_1",
        expression: thing[2].satisfiedState[0]
    }
})

/**
 * Conditional Elses 
 */
brandNewSegments = findAndSegment(brandNewSegments, [
    {
        validator: StringMatch("else"), 
        truthFunction: (segs) => segs.join("")=="else"
    }
], function() { 
    return {type: "conditional_else"}
}) 

/**
 * End statements 
 */
brandNewSegments = findAndSegment(brandNewSegments, [
    {
        validator: StringMatch("end"), 
        truthFunction: (segs) => segs.join("")=="end"
    }
], function() { 
    return {type: "end"}
}) 


//filter out space (probably should filter strings since everything should turn into an object)
//and only leave objects that we can work with 
brandNewSegments = brandNewSegments.filter(seg => {
    if(typeof(seg) == "string" && seg.replaceAll(" ", "").length <= 0) {
        return false 
    }
    return true  
})

const getSubSegmentArrayByObjectKeys = (segments, key, value1, value2, equalityTester) => { 
    if(equalityTester == undefined) { 
        equalityTester = (val1, val2) => val1 == val2 
    }
    let segment1Index = undefined; 
    let segment2Index = undefined; 
    for(let i = 0; i < segments.length; i++) { 
        const seg = segments[i]
        if(typeof(seg) == "string") continue; 
        
        if(segment1Index == undefined) { 
            if(equalityTester(seg[key], value1)== true) { 
                segment1Index = i 
            }
        } else { 
            if(equalityTester(seg[key], value2)== true) { 
                segment2Index = i 
            }
        }
        
    }

    if(segment1Index == undefined || segment2Index == undefined) { 
        return [] 
    } else { 
        return [segment1Index, segment2Index+1]
        //return segments.slice(segment1Index, segment2Index+1)
    }
}

//#TODO problem, imagine if the if condition contains another if condition, it'll register the wrong 'end'
const selectionVector = getSubSegmentArrayByObjectKeys(brandNewSegments, "type", "pre_conditional_1", "end")
const sub = brandNewSegments.slice(selectionVector[0], selectionVector[1])
// console.log("SUB IS", sub)
const replacementSegment = {type: "if_condition", condition: sub[0].expression.contents , if: [], else: []}
let mode = 'if'

for(let i = 1; i < sub.length-1; i++) { 
    const selected = sub[i]
    // console.log("LOOKING AT", selected)
    if(selected.type == "conditional_else") { 
        mode = "else"
        continue 
    }
    if(mode == 'if') { 
        replacementSegment.if.push(selected)
    } else if(mode == "else") { 
        replacementSegment.else.push(selected)
    }
    
}
brandNewSegments = segmentReplace(brandNewSegments, selectionVector, replacementSegment)


// console.log("Brandnew", brandNewSegments)
fs.writeFileSync("./parse_result.json", JSON.stringify(brandNewSegments, null, " "), {encoding:"utf-8"})

const transpiled = processParsed(brandNewSegments) 
console.log("RENDERED", transpiled)
const script = new vm.Script(transpiled);
const context = new vm.createContext({
    console
});
script.runInContext(context);
