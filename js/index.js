// Variables para almacenar datos
let categories = {}; // Almacena las categorías de enfermedades
let diseaseProbabilities = {}; // Almacena las probabilidades de enfermedades según los síntomas
let priorProbabilities = {}; // Almacena las probabilidades previas de cada enfermedad
let selectedSymptoms = []; // Almacena los síntomas seleccionados por el usuario
let selectedCategory = ''; // Almacena la categoría de enfermedad seleccionada

// Cargar datos desde el archivo JSON
fetch('./json/disease-data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        categories = data.categories; // Cargar categorías
        diseaseProbabilities = data.diseaseProbabilities; // Cargar probabilidades de enfermedades
        priorProbabilities = data.priorProbabilities; // Cargar probabilidades previas
        console.log('Prior Probabilities:', priorProbabilities); // Verifica si los datos se cargan correctamente
        populateCategorySelect(); // Llenar el select con categorías
        initializeSymptoms(); // Inicializar síntomas
    })
    .catch(error => console.error('Error loading data:', error));

// Función para llenar el select de categorías
function populateCategorySelect() {
    const categorySelect = document.getElementById('category-select');
    for (const category in categories) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalizar el texto
        categorySelect.appendChild(option);
    }
}

// Inicializa los síntomas según la categoría seleccionada
function initializeSymptoms() {
    const categorySelect = document.getElementById('category-select');
    const symptomsContainer = document.getElementById('symptoms-container');

    categorySelect.addEventListener('change', function() {
        selectedCategory = this.value; // Guardar la categoría seleccionada
        selectedSymptoms = []; // Reiniciar síntomas seleccionados
        symptomsContainer.innerHTML = '';

        if (selectedCategory) {
            const symptoms = categories[selectedCategory];
            symptoms.forEach(symptom => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = symptom;
                checkbox.id = symptom;
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        selectedSymptoms.push(this.value); // Añadir síntoma seleccionado
                    } else {
                        selectedSymptoms = selectedSymptoms.filter(s => s !== this.value); // Remover síntoma deseleccionado
                    }
                    console.log('Síntomas seleccionados (actualización):', selectedSymptoms); // Verifica la actualización
                });

                const label = document.createElement('label');
                label.htmlFor = symptom;
                label.textContent = symptom;

                const symptomDiv = document.createElement('div');
                symptomDiv.appendChild(checkbox);
                symptomDiv.appendChild(label);
                symptomsContainer.appendChild(symptomDiv);
            });
        }
    });
}

// Función para calcular el diagnóstico
function calculateDiagnosis() {
    if (selectedSymptoms.length === 0) {
        alert('Por favor, selecciona al menos un síntoma.'); // Asegurar que hay síntomas seleccionados
        return;
    }
    const resultContainer = document.getElementById('diagnosis-result');
    resultContainer.innerHTML = '';

    const likelihoods = {}; // Almacena la verosimilitud de cada enfermedad
    const totalLikelihood = selectedSymptoms.length; // Total de síntomas seleccionados

    // Verificar que la categoría seleccionada tenga probabilidades de enfermedades
    if (diseaseProbabilities.hasOwnProperty(selectedCategory)) {
        selectedSymptoms.forEach(symptom => {
            const probabilities = diseaseProbabilities[selectedCategory][symptom]; // Obtener probabilidades por síntoma

            if (probabilities) {
                for (const disease in probabilities) {
                    let probability = probabilities[disease];

                    // Validar si el valor es un número
                    if (typeof probability !== 'number') {
                        console.warn(`El valor de ${symptom} en la categoría ${selectedCategory} no es un número:`, probability);
                        probability = 0; // Establecer 0 si no es un número
                    }

                    // Inicializar la probabilidad para la enfermedad si no existe
                    if (!likelihoods[disease]) {
                        likelihoods[disease] = 0;
                    }
                    // Acumular probabilidades en lugar de dividir
                    likelihoods[disease] += Number(probability); // Asegurar que se convierta a número
                }
            } else {
                console.warn(`El síntoma ${symptom} no existe en la categoría ${selectedCategory}. Asignando probabilidad 0.`);
            }
        });
    } else {
        console.warn(`La categoría seleccionada ${selectedCategory} no existe en diseaseProbabilities.`);
    }
    let highestProbability = 0; // Almacena la mayor probabilidad encontrada
    let mostLikelyDisease = ''; // Almacena la enfermedad más probable
    // Aplicar la ley de probabilidades totales
    for (const disease in likelihoods) {
        // Ajustar el factor de incremento para aumentar la probabilidad
        const adjustedLikelihood = likelihoods[disease] * 1; // Aumenta el factor aquí según sea necesario

        // Calcular la probabilidad posterior utilizando el Teorema de Bayes
        const posteriorProbability = adjustedLikelihood * priorProbabilities[disease]; // Multiplicamos sin dividir por totalLikelihood
        
        console.log(`Probabilidad posterior para ${disease}:`, posteriorProbability); // Verificar el cálculo

        if (posteriorProbability > highestProbability) {
            highestProbability = posteriorProbability; // Actualizar la mayor probabilidad
            mostLikelyDisease = disease; // Actualizar la enfermedad más probable
        }
    }
    // Mostrar el resultado del diagnóstico
    if (mostLikelyDisease) {
        resultContainer.innerHTML = `Es más probable que tengas: ${mostLikelyDisease}. (Probabilidad: ${(highestProbability * 100).toFixed(2)}%)`;
    } else {
        resultContainer.innerHTML = 'No se pudo determinar un diagnóstico basado en los síntomas seleccionados.';
    }
}

// Añadir evento al botón
document.getElementById('diagnose-btn').addEventListener('click', calculateDiagnosis);
