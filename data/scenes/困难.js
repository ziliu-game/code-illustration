/* 借场景「困难」 —— 判据只有一条：遮住词牌，把画面念出来，念的是不是这个词。
   改这个场景不影响别的词；新增场景请照抄本文件的形状。 */
module.exports = ctx => {
  const { A, C, at, g, ln } = ctx;
  return g(
    at(40, 2, .82, A.mountain()),
    at(0, 34, .46, A.person()),
    ln(2, 86, 98, 86, 2.4, C.ink2));
};
