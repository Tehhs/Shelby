

export const processParsed = (segments) => { 
    //#TODO might want to doublely make sure that none of your strings are in your segments, otherwise throw some errors to the user maybe 
    
    let transpiled = "" 
    for(let i = 0; i < segments.length; i++) { 
        const seg = segments[i] 
        if(typeof(seg) != 'object') { 
            console.error("Segment " + seg + " is not readable object")
            throw new Error(seg + " is not a readable object")
            continue 
        }
        
        if(seg.type == "var_decl") { 
            transpiled += `let ${seg.name} = ${seg.variable?.contents}\n`
        }
        if(seg.type == "if_condition") { 
            transpiled += `if(${seg.condition}){\n`
            transpiled += processParsed(seg.if)
            if(seg.else.length > 0) {
                transpiled += "} else {\n"
                transpiled += processParsed(seg.else)
                transpiled += "}\n"
            }
        }
        if(seg.type == "method_call") { 
            let replacementMethodName = ""
            if(seg.methodName == "print") { 
                replacementMethodName = "console.log"
            } else { 
                replacementMethodName = seg.methodName
            }
            
            transpiled += `${replacementMethodName}(${seg.value?.value?.contents})\n`
        }
    }

    // console.log(transpiled)
    return transpiled
}