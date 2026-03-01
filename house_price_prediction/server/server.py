from flask import Flask, request, jsonify
import utility

app = Flask(__name__)


@app.route('/')
def home():
    return "House Price Prediction Server Running"


@app.route('/get_location', methods=['GET'])
def get_location():
    response = jsonify({
        "location": utility.get_location_name()
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/predict_price', methods=['POST'])
def predict_price():
    total_sqft = float(request.form['total_sqft'])
    bath = int(request.form['bath'])
    bhk = int(request.form['bhk'])
    location = request.form['location']
    price = utility.predict_price(location, total_sqft, bath, bhk)
    response = jsonify({
        "price": price
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


if __name__ == '__main__':
    print("Starting Flask Server...")
    utility.load_saved_location()   # ✅ CALLING YOUR ACTUAL FUNCTION
    app.run(debug=False)