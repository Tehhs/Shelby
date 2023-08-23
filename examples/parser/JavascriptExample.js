import { SegmentList, TokenOperations } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";

let segList = new SegmentList()
segList.append([`
  let a = "hello there"
  let b = 23 
  let names = ["Liam", "James", "Alex"]

  function func() {}
`])

segList.processStrings() 

segList = segList
//Process Variable Declarations 
.find([
  StringMatch("let"), 
  Space(),
  Alphabetical().name("variable_name").join(), 
  Space(true),
  StringMatch("="),
  Space(true),
  Or(TypeMatch("string"), Numerical()).name("value")
]).transform("variable_declaration")
//Process function declarations 
.find([
  StringMatch("function"),
  Space(),
  Alphabetical().name("function_name").join(),
  Space(true),
  StringMatch("()"), //We're not handling params in this example
  Space(true),
  StringMatch("{}") //We're also not handling function body in this example 
]).transform("function")
//Process lists 
.find([
  StringMatch("["),
  //todo push and collapse not working with object types 
  TypeMatch("string").push("items").collapse(),
  StringMatch(",").on(TokenOperations.LOAD, (context, {self}) => {
    context.newTokenFunctionRequirement([
      TypeMatch("string"),
      self.clone().opt()
    ])
  })
]).transform("list")

console.log(JSON.stringify(segList, null, " "))

