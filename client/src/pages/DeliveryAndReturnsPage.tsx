import React from 'react';

const DeliveryAndReturnsPage = () => {
  return (
    <div 
      className="bg-cover bg-center bg-fixed font-body text-gray-800"
      style={{ backgroundImage: "url('/uploads/fullbg_Desktop.webp')" }}
    >
      <div className="bg-white bg-opacity-75 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white bg-opacity-90 p-8 md:p-12 rounded-xl shadow-2xl max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-heading mb-8 text-center text-gray-900">Shipping and Delivery</h1>
            <div className="prose lg:prose-xl max-w-none text-justify">
              <p>
                Purchases are shipped from our respective warehouse by reputed logistics service providers. Please allow following number of days for delivery from receipt of your order.
              </p>
              <ul>
                <li>
                  <strong>Domestic orders</strong> – All domestic orders are processed within 1 business day (except for Public Holidays & Sundays). You can expect delivery of the order within 3-5 business days
                </li>
              </ul>
              <p>
                Custom charges and handling rates if applicable, will be shared at the time of delivery by the logistics service provider. Please find below the terms and conditions pertaining to Custom and Handling charges -
              </p>
              <ul>
                <li>Your shipment could be subject to Customs Duty Charge / Import Duty / Other applicable government taxes on arrival in the destination country.</li>
                <li>Check the tentative Customs Duty Charge / Import Duty / Other applicable government taxes on the respective government portals.</li>
                <li>Before placing the order, kindly check the cosmetic laws and regulations established by the local government in your country.</li>
                <li>These charges will have to be borne by the customer. Kama Ayurveda is not liable to pay them under any circumstances.</li>
                <li>The shipping charges mentioned in the total order value does not include these charges.</li>
                <li>If the customer refuses to pay the liable shipment custom charges upon its arrival in the destination country the brand will deduct complete shipping and return duty charges from the customer order value while processing the refund.</li>
              </ul>

              <p>ORDER DELIVERIES WILL BE MADE BETWEEN 10:00 AM – 6:00 PM Monday – Saturday. Excluding public holidays</p>
              <p>Goods will need to be signed for upon delivery. If you cannot be there to sign for your delivery please suggest an alternative i.e. a family member, colleague, neighbour, etc. However Kama Ayurveda takes no responsibility for goods signed by an alternative person</p>

              <h2 className="text-2xl font-heading mt-8 mb-4">Shipping Charges</h2>
              <p>
                <strong>Domestic Orders:</strong> We ship products throughout India and all orders qualify for free domestic shipping. Expect free trial orders.
              </p>

              <h2 className="text-2xl font-heading mt-8 mb-4">Returns and Refunds</h2>
              <p>
                At Kama Ayurveda, we strive to give you the very best shopping experience possible. However, considering that opened or damaged products cannot be reused, we cannot accept exchange or return of opened or used products once sold or delivered.
              </p>
              <p>
                In case of damage or quality issue with the product, we can only exchange the product if reported within the specified timeline as mentioned below:
              </p>
              <ul>
                <li>If you receive a Tampered or Damaged product, please inform our Customer Care within 24 hours of receipt, with supporting Images and Video, so we can address your concern at the earliest.</li>
                <li>For any product quality complaints, please contact our Customer Care within 7 days of your order delivery.</li>
              </ul>
              <p>Kama Ayurveda is not responsible for any damage caused after delivery. Damages due to neglect, improper usage or wrong application will not be covered; under our Exchange / Returns Policy.</p>
              <p>Exchange of products will be accepted only if the products are returned in a saleable condition and in their original packaging, in an undamaged condition and subject to following terms -</p>
              <ul>
                <li>Returns and exchanges requests will be subject to checking and vetting by Kama Ayurveda.</li>
                <li>No Refund shall be made once goods are sold.</li>
              </ul>
              <p>Please call us on 18001232031 - All Days (10 AM to 7 PM) or WhatsApp us at +919582929076 or Email - care@kamaayurveda.com where our Customer Care Specialist will be happy to help you.</p>
              
              <footer className="text-center mt-8 text-sm text-gray-600">
                <p>Worldwide Copyright © Kama Ayurveda Pvt. Ltd. (brand owners Kama Ayurveda). All worldwide rights reserved.</p>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAndReturnsPage;
