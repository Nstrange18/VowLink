const VowLinkLoader = ({ message = "Preparing your VowLink workspace..." }) => (
  <div className="vowlink-loader min-h-screen overflow-hidden bg-[#070A13] text-white">
    <div className="vowlink-loader__aura" />
    <div className="vowlink-loader__content" role="status" aria-live="polite">
      <div className="vowlink-loader__markWrap" aria-hidden="true">
        <span className="vowlink-loader__ring vowlink-loader__ring--outer" />
        <span className="vowlink-loader__ring vowlink-loader__ring--inner" />
        <img src="/vowlink-icon.svg" alt="" className="vowlink-loader__mark" />
        <span className="vowlink-loader__spark vowlink-loader__spark--one" />
        <span className="vowlink-loader__spark vowlink-loader__spark--two" />
        <span className="vowlink-loader__spark vowlink-loader__spark--three" />
      </div>
      <p className="vowlink-loader__eyebrow">VowLink</p>
      <h1 className="vowlink-loader__title">Setting the scene</h1>
      <p className="vowlink-loader__message">{message}</p>
      <div className="vowlink-loader__progress" aria-hidden="true">
        <span />
      </div>
    </div>
  </div>
)

export default VowLinkLoader
