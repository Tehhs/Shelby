import { SegmentList, TokenFunction, TokenOperations } from "./parser/Engine.js";
import { StringMatch, Numerical, Alphabetical } from "./parser/ParserFunctions.js"
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





// export const StringMatch = (str) => { 
//     return TokenFunction.from((state) => { 
//         if(state.join("") == str) { 
//             return TokenOperations.ACCEPT; 
//         }  
            
//         if(state.length > str.length) { 
//             return TokenOperations.REJECT
//         }
    
//         return TokenOperations.SAVE; 
        
//     }).setFunctionName(`StringMatch(${str})`)
//   }
const Or = (...tokenFunctions) => { 
    return TokenFunction.from((state)=>{
        let allRejected = true  
        for(const tfFunc of tokenFunctions) { 
            const op = tfFunc.call(state)
            if(op != TokenOperations.REJECT) {
                allRejected = false 
            }
            if(op == TokenOperations.ACCEPT) return TokenOperations.ACCEPT;
            if(op == TokenOperations.LOAD) return TokenOperations.LOAD;
        }
        if(allRejected == true) { 
            return TokenOperations.REJECT
        }
        return TokenOperations.SAVE
    })
}

const Space = () => { 
    return TokenFunction.from((state) => { 
        console.log(`SPACE PROCESSING "${state.join("")}"`)
        const last = state[state.length-1]

        if(state.length < 2 && last !== " ") { 
            return TokenOperations.REJECT
        }
        
        if(last !== " ") { 
            return TokenOperations.LOAD
        } else { 
            return TokenOperations.SAVE 
        }
    })
}
// console.log(Space().call("d".split("")))
// process.exit(1)
// console.log(Or( StringMatch("protected "), StringMatch("public ")).name("access_type").call("protected ".split("")))
// process.exit(1)


const sList = new SegmentList(); 
sList.append([`
    let a = 5 
    let b = "yes"
    print(a)
    print(b) 
`])
sList.processStrings()


const MultiStringMatch = (...strs) => { 
    const stringMatchFunctions = []
    for(const str of strs) { 
        stringMatchFunctions.push( 
            StringMatch(str)
        )
    }
    return Or(...stringMatchFunctions)
}

const VARIABLE_DECL_TYPE = MultiStringMatch("let", "number").name("var_decl_type").propagate()
const VARIABLE_NAME = Alphabetical().name("variable_name").propagate()
const EQUALS = StringMatch("=")

const SPACE = Space() 

const TypeMatch = (type) => { 
    return TokenFunction.from((state) => {
        const last = state[state.length-1]
        if(typeof(last) != "object") return TokenOperations.REJECT
        if(last.type != type) return TokenOperations.REJECT
        return TokenOperations.ACCEPT
    }) 
}

const newSegList = sList.find([
    VARIABLE_DECL_TYPE,
    SPACE, 
    VARIABLE_NAME,
    SPACE,
    EQUALS,
]).transform("method_decl")
.find([
    TypeMatch("method_decl"),
    SPACE,
    Numerical()
]).transform("method_decl_1")


console.log("CHEESE? " ,newSegList)