function calculateMean(arr) {
    const sum = arr.reduce((acum, value) => acum + value, 0)
    return sum / arr.length
}


module.exports = { calculateMean }