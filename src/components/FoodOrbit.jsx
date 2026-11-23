import React from 'react';

const FOOD_IMAGES = [
  { name: 'Chocolate crepe', src: '/food/chocolate-crepe.jpeg', position: 'left-[3%] top-[24%]', size: 'h-16 w-16 sm:h-20 sm:w-20', delay: '0s' },
  { name: 'Burger', src: '/food/burger.jpeg', position: 'right-[4%] top-[20%]', size: 'h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24', delay: '1.1s' },
  { name: 'Mango dessert', src: '/food/mango-dessert.jpeg', position: 'left-[9%] bottom-[12%]', size: 'h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]', delay: '1.8s' },
  { name: 'Grain bowl', src: '/food/grain-bowl.jpeg', position: 'right-[10%] bottom-[10%]', size: 'h-16 w-16 sm:h-20 sm:w-20', delay: '0.6s' },
];

export function FoodOrbit() {
  return (
    <div aria-label="Food photos" className="food-orbit-layer absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
      {FOOD_IMAGES.map((food) => (
        <img
          key={food.name}
          src={food.src}
          alt={food.name}
          loading="lazy"
          className={`food-orbit-image absolute ${food.position} ${food.size} rounded-full object-cover border-[3px] border-white/90 shadow-xl`}
          style={{ animationDelay: food.delay }}
        />
      ))}
    </div>
  );
}
