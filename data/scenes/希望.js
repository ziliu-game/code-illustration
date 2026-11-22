/* 借场景「希望」 —— 判据只有一条：遮住词牌，把画面念出来，念的是不是这个词。
   改这个场景不影响别的词；新增场景请照抄本文件的形状。 */
module.exports = ctx => {
  const { A, C, arc, at, g, ln, pol } = ctx;
  return g(
    at(6, 30, .58, A.sprout()),
    at(66, 4, .3, A.sun()),
    ln(2, 86, 98, 86, 2.4, C.ink2),
    arc('M74,74 q-8,-18 0,-34', 2.2, C.ink2),
    pol('74,36 68,46 82,48', C.ink2));
};
