import { SegmentList, TokenFunction, TokenOperations } from "./parser/Engine.js";
import { StringMatch, Numerical, Alphabetical, MultiStringMatch, TypeMatch, Or, Space } from "./parser/ParserFunctions.js"

const VARIABLE_DECL_TYPE = _ => MultiStringMatch("let", "number").name("var_decl_type")
const VARIABLE_NAME = _ => Alphabetical().name("variable_name")
const EQUALS = _ => StringMatch("=")
const SPACE = _ => Space() 

const sList = new SegmentList(); 
sList.append([`
    let a = 5 
    let b= "yes"

    print(a)
    print(b) 

    banana john

    ---start 
    ["Liam","John","Alex","Bob"]
    ---end 
`]).processStrings()



const segmentList = sList.find([
    VARIABLE_DECL_TYPE().join(true),
    SPACE(), 
    VARIABLE_NAME(),
    SPACE().opt(),
    EQUALS(),
]).transform("var_decl_info")
.find([
    TypeMatch("var_decl_info").name("var_decl_info").collapse(true),
    SPACE().opt(),
    Or(TypeMatch("string"), Numerical()).collapse({value: "contents"})
]).transform("variable")
.find([
    StringMatch("print"),
    SPACE().opt(),
    StringMatch("("),
    SPACE().opt(),
    Alphabetical().name("variable"),
    SPACE().opt(),
    StringMatch(")")
]).transform("print_function")
.find([
    StringMatch("banana").name("fruit").join()
        .on(TokenOperations.ACCEPT, (context) => { 
            context.newTokenFunctionRequirement(
                [SPACE(), StringMatch("john").name("name").join()]
            )
        })
]).transform("found!")
.find([
    StringMatch("["),
    TypeMatch("string").name("string").collapse(),
    StringMatch(",").name("COMMA!").opt().on(TokenOperations.ACCEPT, function(context, {self}){
        const clone = self.clone().opt()
        if(clone == undefined) { 
            debugger; 
        }
        console.log("THIS = ", self)
        context.newTokenFunctionRequirement([
            TypeMatch("string").name("string").collapse(),,
            clone
        ])
    })
]).transform("BIGFUNKINGARRAY___")
.find([
    StringMatch("---"),
    Or(StringMatch("start"), StringMatch("end")).name("eventName").join()
]).transform("event")


// .find([
//     StringMatch("["),
//     LISTED(StringMatch("!"), StringMatch(",")),
//     StringMatch("]")
// ])
// //.filterEmptyStrings()

// const createOpRemapper = (remapObject) => { 
//     return (opCodeInput) => { 
//         return OpRemap(opCodeInput, remapObject)
//     }
// }
// const OpRemap = (opCode, remapObject) => { 
//     return remapObject[opCode]
// }

// const LISTED = (tfItem, tfSeparator) => { 
//     tfItem.opt(false)
//     tfSeparator.opt(false)
    
//     //think about since youre making a context in the parser and passing it onto tf, maybe you want to pass 
//     //the context into this function too as a third param. but if you do that, do you need to pass the context
//     //into the tf at all? probably should do it on the tf level for the re-usablity factor?

//     tfSeparator.on([TokenOperations.ACCEPT, TokenOperations.LOAD], APPEND(tfItem.copy()))


//     return [tfItem, tfSeparator] //need to write in support for returning arrays, and flatten all sub arrays 
// }

console.log("Results:  ", JSON.stringify(segmentList, null, " "))