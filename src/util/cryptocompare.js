import axios from 'axios';

// enhance the original axios adapter with throttle and cache enhancer
const http = axios.create({
    baseURL: 'https://min-api.cryptocompare.com/data'
});

const conversions = {};

export const convertEthToFiat = (ethAmount, fiatSymbol) => {
    if(ethAmount && fiatSymbol) {
        if(conversions[fiatSymbol] && conversions[fiatSymbol][ethAmount]){
            return new Promise((resolve, reject) => {
                resolve(conversions[fiatSymbol][ethAmount]);
            })
        } else {
            return http.get('price?fsym=ETH&tsyms=' + fiatSymbol)
                .then(response => {
                    console.log(response);
                    const value = response.data[fiatSymbol];
                    if(conversions[fiatSymbol]) {
                        conversions[fiatSymbol][ethAmount] = value;
                    } else {
                        conversions[fiatSymbol] = {[ethAmount]: value};
                    }
                    return value;
                })
                .catch(error => {
                    console.error(error);
                    throw error;
                });
        }
    }
};