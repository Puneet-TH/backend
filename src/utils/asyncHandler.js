// const asyncHandler = (fun) => async(req, res, next) => {
//      try {
//         await fn(req, res, next)
//      } catch (error) {
//         res.status(error.code || 500).json({
//             sucess: false,
//             message: error.message
//         })
//      }
// }

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}
/*
you dont need to intall any npm package:

instead write this :

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
Without this wrapper, you'd need to write try/catch in every async route:

router.get("/", async (req, res, next) => {
  try {
    const data = await somethingAsync();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
With asyncHandler, you can simplify it:

router.get("/", asyncHandler(async (req, res) => {
  const data = await somethingAsync();
  res.json(data);
}));
so instead of writing try/catch block inside your endpoint handlers use the asyncHandler.

*/