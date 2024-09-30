// SERVER LIBS
import Tron from './tron'

type Dictionary = { [key:string]:any }

const Chains:Dictionary = {
  'Tron': Tron,
}

export default Chains