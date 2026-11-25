// Where a collection image is served from. Most image files are paths on this
// site (marks/img/...); some are full addresses on the media host
// (https://media.heirloomapp.io/...). Safe to import from islands: no Node.
export const media = (file: string) => (/^https?:\/\//.test(file) ? file : `/${file.replace(/^\/+/, '')}`);
