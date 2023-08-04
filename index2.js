import { SegmentList } from "./parser/engine2.js"

/**
    const returns = { 
        save: 1, //save result, true 
        load: 2, //return the last saved result, false,
        ignore: 3, //ignore this token and reset, for optional

    }

    Segments.find([
        OR(StringMatch("public"), StringMatch("protected")),
        Opt(StringMatch("static")).name("static").propagte(),
        StringMatch("void"), 
        FunctionName().name("FunctionName").propagate()
        MethodBlock().name("method_block").propagate(),
        Opt(StringMatch(",")).reset() 
    ).transform("method") 
*/


// let segments = new SegmentList()
// segments.append([`print("Hello")`])
// segments.processStrings() 
// console.log(segments)


let elseStatement = (total, newest) => { 
    const str = 'else'
    if(typeof(newest) != "string") return false 

    total = total.join("")
    for(let i = 0; i < total.length; i++) { 
        if(i >= str.length) break;
        if(total[i] != str[i]) return false; 
    }
    if(total.length > str.length) return false 

    return true 
}

console.log(elseStatement(["e", "l", "s"], "s"))


//the problem is that when we hit a false, there's no way to reject the loading of the old satisfiedstate
//ignore should do that 
//ignore should be like load (false) but not load satisfied state
const returns = { 
    save: 1, //save result, true 
    load: 2, //return the last saved result, false,
    ignore: 3, //ignore this token and reset, for optional,
    pass: 4, //no match but instead of rejecting the entire token function set, move onto next token function and reset string search index 


}
const OR = (...funcs) => { 
    return (total, newest) => { 
        for(const func of funcs) { 

        }
    }
}
yyy(segments, [
    OR(func1, func2)
])
//another change is that ignore should happen by default, and only load when needed 
//but thats up the how the programmer wants to handle the token functions 

elseStatement = (total, newest) => { 
    const str = 'else'
    if(typeof(newest) != "string") return returns.load 

    total = total.join("")
    for(let i = 0; i < total.length; i++) { 
        if(i >= str.length) break;
        if(total[i] != str[i]) return returns.ignore; 
    }
    if(total.length > str.length) return returns.load 

    return returns.save  
}

console.log(elseStatement(["e", "l", "s"], "s"))