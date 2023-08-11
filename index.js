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
sList.append(["-- public     static void pizza --"])

const ACCESS_TYPE = Or( StringMatch("protected"), StringMatch("public")).name("access_type").propagate()
const RETURN_TYPE = Or( StringMatch("void"), StringMatch("int"), StringMatch("String")).name("return_type")
const STATIC_KEYWORD = StringMatch("static").name("is_static").propagate()
const METHOD_NAME = Alphabetical().name("method_name").propagate()
const SPACE = Space() 

const newSegList = sList.find([
    ACCESS_TYPE,
    SPACE, 
    STATIC_KEYWORD,
    SPACE,
    RETURN_TYPE,
    SPACE, 
    METHOD_NAME,
]).transform("method_decl")



console.log("!!", newSegList)