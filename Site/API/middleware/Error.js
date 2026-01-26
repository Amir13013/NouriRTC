const some_error = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 500,
        message: "Oups, un problème est survenu",
        error: err.message,
    });
};

export default some_error;
