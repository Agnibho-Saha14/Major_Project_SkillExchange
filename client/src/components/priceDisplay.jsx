export default function PriceDisplay({ price, priceType, paymentOptions }) {
  if (paymentOptions === 'exchange') {
    return <span className="text-blue-600 font-semibold">Skill Exchange</span>
  }
  
  if (paymentOptions === 'both') {
    return (
      <div className="flex flex-col">
        <span className="text-green-600 font-semibold">₹{price}/{priceType}</span>
        <span className="text-blue-600 text-sm">or Exchange</span>
      </div>
    )
  }
  
  return <span className="text-green-600 font-semibold">₹{price}/{priceType}</span>
}