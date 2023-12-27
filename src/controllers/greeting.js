exports.greeting = async (req, res) => {
    res.status(200).json({
        response: '¡Hola desde api viajes!, esta API es para el proyecto de viajes pagos por medios de pagos de terceros',
    });
}