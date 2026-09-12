/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ['@overheard/types'],
  // The dev-tools badge sits bottom-left over a real card and bakes itself into
  // any screenshot of the board. Off, so captures read as the product.
  devIndicators: false,
}
