find a way to deal with list of things 
find a wsya to deal with optional things 


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