import { captureStrings, split, findAndSegment } from "./engine.js"
import fs from "fs"

let strArray =    [`
    :name "Liam" 
    :age 25 

    if age >= 20 then 
        print(":name is old")
    else 
        print(":age is young!")
    end 
`]

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

        return () => { 
            if(total != str) { 
                return false 
            }
            return true 
        }
    }
}
const TypeMatch = (type) => { 
    return (total, newest) => { 
        if(typeof(newest) != "object") return false 
        if(total.length > 1) return false 
        if(total[0].type != type) return false 
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
        contents: `${thing[0].satisfiedState.join("")}${thing[1].satisfiedState.join("")}${thing[2].satisfiedState.join("")}${typeof(thing[3].satisfiedState[0]) == "object" ? thing[3].satisfiedState[0].contents : thing[3].satisfiedState.join("")}`,
        // variable_value: thing[3].satisfiedState[0].contents
        variable: typeof(thing[3].satisfiedState[0]) == "object" ? thing[3].satisfiedState[0] : {
            type: "number", 
            contents: Number(thing[3].satisfiedState.join(""))
        },
        b: 5
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
        thing,
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
console.log("BEFORE",brandNewSegments )
/**
 * Conditions 
 */
brandNewSegments = findAndSegment(brandNewSegments, [StringMatch("if"), SPACER, TypeMatch("expression"), SPACER, StringMatch("then")], (thing)=>{ 
    return {  
        type: "pre_conditional_1",
        expression: thing[2].satisfiedState[0]
    }
})



console.log("Brandnew", brandNewSegments)
fs.writeFileSync("./output.json", JSON.stringify(brandNewSegments, null, " "), {encoding:"utf-8"})

