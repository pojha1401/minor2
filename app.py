from flask import Flask, render_template, request, jsonify
import numpy as np
import joblib

app = Flask(__name__, template_folder='templates')

# Load the pre-trained machine learning model
model = joblib.load('insurancepredict.pkl')


@app.route('/')
def index():
    return render_template('form.html')


@app.route('/predict', methods=['GET', 'POST'])
def predict():
    try:
        # Extract input data from the JSON request
        data = request.get_json()
        age = float(data['age'])
        sex = float(data['sex'])
        bmi = float(data['bmi'])
        children = float(data['children'])
        smoker = float(data['smoker'])
        region = float(data['region'])

        # Prepare input features for prediction
        if region == 0:
            input_features = np.array(
                [[age, sex, bmi, children, smoker, 1, 0, 0, 0]])
        else:
            input_features = np.array(
                [[age, sex, bmi, children, smoker, 0, 1, 0, 0]])

        # Make prediction
        prediction = model.predict(input_features)

        # Return the prediction as a JSON response
        return jsonify({'prediction': float(prediction[0])})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
