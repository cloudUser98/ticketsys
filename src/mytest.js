self.onmessage = function(event) {
    console.log("El worker recibe: ", event.data);

    const result = unboundedKnapsack(event.data);

    postMessage(result);
};

function unboundedKnapsack({capacity, weights, values}) {
    // Scale the capacity to handle float values
    const scale = 1000; // Scale factor to convert float to int for better precision
    const intCapacity = Math.floor(capacity * scale);

    // Scale the weights accordingly
    const scaledWeights = weights.map(weight => Math.floor(weight * scale));

    // Initialize arrays for storing maximum values and items selected
    const dp = Array(intCapacity + 1).fill(0);
    const itemsSelected = Array.from({ length: intCapacity + 1 }, () => []);

    // Compute the maximum value for each scaled capacity from 0 to intCapacity
    for (let i = 0; i <= intCapacity; i++) {
        for (let j = 0; j < scaledWeights.length; j++) {
            if (scaledWeights[j] <= i) {
                const newValue = dp[i - scaledWeights[j]] + values[j];
                if (newValue > dp[i]) {
                    dp[i] = newValue;
                    itemsSelected[i] = [...itemsSelected[i - scaledWeights[j]], j];
                }
            }
        }
    }

    // Get the total value and the items selected for the full capacity
    const maxValue = dp[intCapacity];
    const selectedItems = itemsSelected[intCapacity];

    return { maxValue, selectedItems };
}
