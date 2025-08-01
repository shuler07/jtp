import './RouletteMainContainer.css';

export default function RouletteMainContainer({ reference, left1, left2 }) {
    return (
        <div id='subContainer'>
            <div ref={reference} id='mainContainer'>
                <img className='mainImage' src='./shared-assets/images/Roulette.png' style={{ left: left1 }}></img>
                <img className='mainImage' src='./shared-assets/images/Roulette.png' style={{ left: left2 }}></img>
                <img id='arrowImage' src='./shared-assets/images/RouletteArrowImage.png'></img>
            </div>
        </div>
    );
}
