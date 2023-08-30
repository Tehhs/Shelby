import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";

let segList = new SegmentList()

const TagType = () => {
  return Or(StringMatch("div"), StringMatch("span")).name("tag_type").join()
}
const Text = () => { 
  return Alphabetical().join().name("text")
}

segList.append([`
  
  div/.bold/.italic/$jump<?>/$click<console.log(\`awesome\`)> Click me! 

`])

//todo there can be parts of the input that you dont want to transform to string objects, 
//todo cont. this is why we need to use ` in the above append as a temp solution 
segList.processStrings() 
segList = segList

//Find classes
.find([
  StringMatch("/"),
  StringMatch("."),
  Alphabetical().name("class_name").join(), 
]).transform("class_decl")

//Find Js enclosures
.find([
  StringMatch("<"),
  StringMatch("$"),
  Alphabetical().name("event_name").join(), 
]).transform("class_decl")

//Find events
.find([
  StringMatch("/"),
  StringMatch("$"),
  Alphabetical().name("event_name").join(), 
  StringMatch("<"),
  CaptureUntil(">").name("js").join(), //! now we need join to handle objects too,
  StringMatch(">")
]).transform("js_decl")

//Process together 
.find([
  StringMatch("div"),
  //todo must use name() before collapse can work 
  //! todo A lot of peoblems can be fixed by allowing the Or function to let the transformer know 
  //! which real TokenFunction it has matched with. Might do this via context function? 
  Or(TypeMatch("class_decl").name("EGGS"), TypeMatch("js_decl")).name("addition").collapse([ 
    select("event_name").rename("_event_name").push(), //todo must rename here to include via selection
    select("class_name").rename("_class_name").push() //todo must rename here to include via selection
    //! above now wont always work when we want to select two values from same object and do something custom
    //! with them 
  ]).on(TokenOperations.ACCEPT, (context, {self}) => { //todo hook onto more than one tokenop event 
    context.newTokenFunctionRequirement([
      self.clone().opt()
    ])
  }).opt(), //!wont work because you're working on an Or TokenFunction which will now save events for more than one TokenFunction,
  Space().opt(),
  Text()

]).transform('tag')

// .filterEmptyStrings()

function CaptureUntil (...disallowedStringsArray) { 
  return TokenFunction.from(
    ({state}) => { 
      const lastState = state[state.length-1];
      if(disallowedStringsArray.includes(lastState)) { 
        return TokenOperations.LOAD;
      } else { 
        return TokenOperations.SAVE;
      }
    }
  )
}

//This example could be improved by showing how you can ensure the parser looks for the correct closing tag 
//this can be done with the context object, but do you even want to do that in the first place? might kill the 
//parse process because of some tag incompatibility 
console.log(JSON.stringify(segList, null, " "))

