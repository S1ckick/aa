const assert = require("assert");

function func(a){
    return a;
}

describe("func",function(){
    it("func проверка #1", function(){
        assert.equal(0, func(0));
        assert.equal(1,func(2));
        assert.equal(2,func(2));
    })
    it("func проверка #2", function(){
        assert.notEqual(2, func(20));
        assert.equal("2",func(2));
    })
})