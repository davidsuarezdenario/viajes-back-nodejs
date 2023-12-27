exports.greeting = async (req, res) => {
    res.status(200).json({
        response: '¡Hola desde api de TuViaje!!',
    });
}